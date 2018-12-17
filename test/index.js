/* Requires */
const assert = require('assert');
const MongoImporter = require('../src/index');

const mongoImporter = new MongoImporter({
    dbName: 'test',
    dbUser: 'test1',
    dbPass: 'test1'
})

describe('importFiles', function(){
    it('shall import multiple csv and json files into mongodb', function(){
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
})
