'use strict';

/* Requires */
const async = require('async');
const assert = require('assert');
const csvParse = require('csv-parse');
const debug = require('debug')('mongoimporter')
const fs = require('fs');
const mongodb = require('mongodb');
const os = require('os');
const path = require('path');

/* Constants */
const MongoClient = mongodb.MongoClient;

/* Class */
class MongoImporter{
    constructor(cfg){
        this.dbHost = cfg.dbHost || '127.0.0.1';
        this.dbPort = cfg.dbPort || '27017';
        this.shards = cfg.shards || [];
        this.dbName = cfg.dbName || 'test';
        this.attachUser = cfg.attachUser;
    }

    buildConnectionURI(){
        var connectionURI = 'mongodb://';
        if( this.shards.length > 0 ){
            // Build string using shards
            var connectionURIs = [];
            this.shards.forEach((shard) => {
                connectionURIs.push(`${shard.host}:${shard.dbPort || this.dbPort}/${this.dbName}`)
            })
            connectionURI += connectionURIs.join(',')
        } else {
            // Build string using this.dbHost and this.dbPort
            connectionURI += `${this.dbHost}:${this.dbPort}/${this.dbName}`
        }

        return connectionURI;
    }

    async connect(options){
        options.useNewUrlParser = true;
        const homeDir = os.homedir();
        if( options.ssl ){
            // (Self-signed certs for dev)
            ['sslKey', 'sslCert', 'sslCA'].forEach((option) => {
                if( typeof options[option] == 'string' ){
                    // convert to buffer (mongodb nodejs api expects buffer)
                    options[option] = fs.readFileSync(options[option].replace('~', homeDir));
                }
            })
        }

        if( options.authMechanism == 'MONGODB-X509' ){
            // Auth using client X509 cert:
            this.dbName = 'admin';
            options.authSource = '$external';
            /*
            options.auth = ["subject line" of client cert (see mongod docs regarding "client cert auth")]
            i.e.,
            > openssl x509 -in client.pem -inform PEM -subject -nameopt RFC2253
            --> subject emailAddress=...,CN=...,O=...,L=...,ST=..,C=..
            -->         ^---------------------------------------------^ (client cert "username")
            */
        } else {
            // Using SCRAM:
            options.authSource = options.authSource || this.dbName;
        }
        var connectionStr = this.buildConnectionURI();
        console.log('Connecting to db...', connectionStr)
        debug('Connection options', options)
        this.client = new MongoClient(connectionStr, options)
        await this.client.connect().catch((err) => {
            throw new Error(err);
        })
        this.db = this.client.db(this.dbName)
    }

    disconnect(){
        return this.client.close();
    }

    import_csv(file, options){
        debug('import_csv', file, 'options=', options)
        assert( options.headerline && !options.fields, 'need to specify headerline or fields' )
        assert( options.collectionName, 'need to specify a collection to import to')
        const csvParser = csvParse({
            delimiter: options.csvDelimiter || ',',
            columns: options.headerline || options.fields,
            relax: true
        })
        var self = this;
        var docs = [];

        return new Promise((resolve, reject) => {
            fs.createReadStream(file, {encoding: 'utf-8'})
            .pipe(csvParser)
            .on('data', (data) => {
                var doc = data;
                if( options.attachUser != null ){
                    // First respect the "attachUser" option provided in this function call
                    if( options.attachUser != false )
                        doc.attachedUser = options.attachUser;
                } else if( self.attachUser ){
                    // Otherwise respect the "attachUser" option part of the mongoImporter instance, if it exists
                    doc.attachedUser = self.attachUser;
                }
                docs.push(doc);
            })
            .on('end', () => {
                var collectionName;
                if( typeof options.collectionName == 'object' && options.collectionName.useFilename ){
                    collectionName = options.fileName;
                } else {
                    collectionName = options.collectionName;
                }
                self.db.collection(collectionName).insertMany(docs, (err, resp) => {
                    if( err ){
                        console.log('docs import err', err)
                        reject(err);
                    } else {
                        console.log(resp.insertedCount, 'docs inserted into', collectionName, 'from', file)
                        resolve();
                    }
                })
            })
        });
    }

    import_json(file, options){
        debug('import_json', file, options)
        assert( options.collectionName, 'need to specify a collection to import to')
        var self = this;
        var docs = [];
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf-8', (err, resp) => {
                if( err ){
                    reject(err);
                    return;
                }

                var collectionName;
                if( typeof options.collectionName == 'object' && options.collectionName.useFilename ){
                    collectionName = options.fileName;
                } else {
                    collectionName = options.collectionName;
                }

                var json = JSON.parse(resp);
                if( json.__proto__.constructor.name == 'Object' ){
                    // insert doc
                    var doc = json;
                    if( options.attachUser != null ){
                        // First respect the "attachUser" option provided in this function call
                        if( options.attachUser != false )
                            doc.attachedUser = options.attachUser;
                    } else if( self.attachUser ){
                        // Otherwise respect the "attachUser" option part of the mongoImporter instance, if it exists
                        doc.attachedUser = self.attachUser;
                    }
                    docs.push(doc);
                } else if( json.__proto__.constructor.name == 'Array' ){
                    // insertMany docs...
                    json.forEach((entry) => {
                        var doc = entry;
                        if( options.attachUser ){
                            doc.user = user;
                        }
                        docs.push(doc);
                    })
                }

                self.db.collection(collectionName).insertMany(docs, (err, resp) => {
                    if( err ){
                        console.log('docs import err', err)
                        reject(err);
                    } else {
                        console.log(resp.insertedCount, 'docs inserted into', collectionName, 'from', file)
                        resolve();
                    }
                })
            })
        });

    }

    importFiles(files, options){
        debug('importFiles', files, options)
        assert(files && files.length > 0, 'Need to specify at least one file')
        var self = this;
        return new Promise(function(resolve, reject) {
            async.each(files, (file, callback) => {
                var pathInfo = path.parse(file);
                pathInfo.fileType = options.fileType || pathInfo.ext.slice(1);
                assert(self['import_' + pathInfo.fileType], 'fileType ' + pathInfo.fileType + ' unsupported (for now)')
                self['import_' + pathInfo.fileType](file, {
                    attachUser: options.attachUser,
                    csvDelimiter: options.csvDelimiter,
                    collectionName: options.collectionName,
                    headerline: options.headerline,
                    fileName: pathInfo.name
                })
                .finally(callback)
            }, (err) => {
                if( err ){
                    reject(err);
                } else {
                    resolve(files.length);
                }
            })
        });
    }

    importDir(dir, options){
        debug('importDir', dir, options)
        assert(dir, 'Need to specify a directory')
        var self = this;
        if( options.collectionName.useDirectoryName ){
            options.collectionName = path.parse(dir).name;
        }
        return new Promise((resolve, reject) => {
            fs.readdir(dir, {withFileTypes: true}, (err, entries) => {
                var files = entries
                .filter((entry) => !entry.isDirectory())
                .map((entry) => path.resolve(dir, entry.name))
                self.importFiles(files, options)
                .then(resolve, reject)
            })
        });
    }
}

module.exports = MongoImporter;
