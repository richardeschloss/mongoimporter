'use strict';

/* Requires */
const async = require('async');
const assert = require('assert');
const csvParse = require('csv-parse');
const debug = require('debug')('mongoimporter')
const fs = require('fs');
const mongodb = require('mongodb');
const path = require('path');

/* Constants */
const MongoClient = mongodb.MongoClient;

/* Class */
class MongoImporter{
    constructor(cfg){
        this.dbHost = cfg.dbHost || 'localhost';
        this.dbPort = cfg.dbPort || '27017';
        this.dbName = cfg.dbName || 'test';
        this.dbUser = cfg.dbUser;
        this.dbPass = cfg.dbPass;
        this.dbConnected = false;
    }

    connect(){
        return new Promise((resolve, reject) => {
            this.dbUrl = `mongodb://${this.dbUser}:${this.dbPass}@${this.dbHost}:${this.dbPort}/${this.dbName}`;
            MongoClient.connect(this.dbUrl, { useNewUrlParser: true })
            .then((client) => {
                console.log('DB connected to', this.dbName)
                this.dbConnected = true;
                this.client = client;
                this.db = client.db(this.dbName);
                resolve();
            }, (err) => {
                console.log('Error connecting to database', err)
                reject(err);
            })
        })
    }

    disconnect(){
        this.client.close();
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
        var docs = [], user = this.dbUser, db = this.db;

        return new Promise((resolve, reject) => {
            fs.createReadStream(file, {encoding: 'utf-8'})
            .pipe(csvParser)
            .on('data', (data) => {
                var doc = data;
                if( options.attachUser ){
                    doc.user = user;
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
                db.collection(collectionName).insertMany(docs, (err, resp) => {
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
        var docs = [], user = this.dbUser, db = this.db;
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
                    if( options.attachUser ){
                        doc.user = user;
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

                db.collection(collectionName).insertMany(docs, (err, resp) => {
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
