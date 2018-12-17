/* Requires */
const assert = require('assert');
const MongoImporter = require('../src/index');

describe('importFiles', function(){
    it('shall import multiple csv and json files into mongodb', function(){
        const mongoImporter = new MongoImporter({
            dbName: 'test',
            dbUser: 'test1',
            dbPass: 'test1'
        })
        console.log('using db', mongoImporter.dbName)
        var files = [
            './datasets/example1.csv',
            './datasets/example2.csv',
            './datasets/example3.json',
            './datasets/example4.json',
        ]
        mongoImporter
        .connect()
        .then(() => {
            mongoImporter.importFiles(files, {
                csvDelimiter: ',',
                collectionName: {
                    useFilename: true
                },
                headerline: true
            })
            .then((filesImported) => {
                assert(filesImported == files.length, 'not all files were imported')
                mongoImporter.disconnect();
            })
        })
    })

    it('shall import files from a specified directory into mongodb', function(){
        const mongoImporter2 = new MongoImporter({
            dbName: 'test',
            dbUser: 'test1',
            dbPass: 'test1'
        })
        console.log('using db', mongoImporter2.dbName)
        var dir = 'datasets';
        mongoImporter2
        .connect()
        .then(() => {
            mongoImporter2.importDir(dir, {
                csvDelimiter: ',',
                collectionName: dir,
                headerline: true
            })
            .then((dirImported) => {
                mongoImporter2.disconnect();
            }, (err) => {
                assert(false);
            })
        })
    });
})
