'use strict';

/* Requires */
const assert = require('assert');
const csvParse = require('csv-parse');
const fs = require('fs');
const mongodb = require('mongodb');
const path = require('path');

/* Constants */
const MongoClient = mongodb.MongoClient;

/* Class */
class Importer{
    constructor(cfg){
        this.dbHost = cfg.dbHost || 'localhost';
        this.dbPort = cfg.dbPort || '27017';
        this.dbName = cfg.dbName || 'test';
        this.collections = cfg.collections || ['test'];

        this.headerline = cfg.headerline;
    }

    connect(){
        return new Promise((resolve, reject) => {
            this.dbUrl = `mongodb://${this.dbHost}:${this.dbPort}/${this.dbName}`;
            MongoClient.connect(this.url, { useNewUrlParser: true })
            .then((client) => {
                console.log('DB connected to', this.collectionName)
                this.client = client;
                this.db = client.db(this.dbName);
                resolve();
            })
        })
    }

    import_csv(file, options){
        console.log('import_csv', file, options)
        const csvParser = csvParse({
            delimiter: options.csvDelimiter || ','
        })
        fs.createReadStream(file, {encoding: 'utf-8'})
        .pipe(csvParser)
        .on('data', (data) => {
            console.log('data', data)
        })
    }

    import_csvX(file, options){
        assert( this.headerline && !this.fields, 'need to specify headerline or fields' )
        var eolChar = options.eolChar || '\n';
        var csvDelimiter = options.csvDelimiter || ',';
        fs.readFile(file, 'utf-8', (err, resp) => {
            if( this.headerline ){
                var lines = resp.split(eolChar);
                var fields = lines[0].split(csvDelimiter);
                console.log('fields', fields)
                var rows = lines.slice(1);
                console.log('rows', rows)
                var docs = [];
                rows.forEach((row, rowIdx) => {
                    // console.log('row', row.split(csvDelimiter))
                    var doc = {};
                    row.split(csvDelimiter).forEach((cell, colIdx) => {
                        // console.log('cell', cell)
                        doc[fields[colIdx]] = cell;
                    })
                    docs.push(doc)
                    // console.log('doc', doc)
                })

                // console.log('rows', rows)
            }
        })
    }

    importFile(file, options){
        console.log('importFile', file, options)
        assert(file, 'Need to specify a file')
        var pathInfo = path.parse(file);
        pathInfo.fileType = options.fileType || pathInfo.ext.slice(1);
        console.log('pathInfo', pathInfo)
        assert(this['import_' + pathInfo.fileType], 'fileType ' + pathInfo.fileType + ' unsupported (for now)')
        this['import_' + pathInfo.fileType](file, options)
    }
}

module.exports = Importer;
