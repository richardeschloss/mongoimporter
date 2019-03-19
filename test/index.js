/* Requires */
const assert = require('assert');
const fs = require('fs');
const MongoImporter = require('../src/index');
const testConfig = require('../testConfig.json')

describe('Import Files', function(){
    console.log('testConfig', testConfig)
    const mongoImporter = new MongoImporter(testConfig.mongoClient)
    it('shall successfully connect to mongodb', function(done){
        mongoImporter.connect(testConfig.mongoClient.connectOptions)
        .then((resp) => {
            console.log('connected to mongoDB')
            done();
        })
        .catch(done)
    })

    it('shall import multiple csv and json files into mongodb', function(done){
        mongoImporter.importFiles(testConfig.importFiles, testConfig.importFiles_options)
        .then((resp) => {
            assert(resp == testConfig.importFiles.length, `expected resp to be ${testConfig.importFiles.length}`)
            done()
        })
        .catch(done)
    })

    it('shall import files from a specified directory into mongodb', function(done){
        const allEntries = fs.readdirSync(testConfig.importDir, {withFileTypes: true});
        const dirEntries = allEntries.filter((entry) => !entry.isDirectory());
        mongoImporter.importDir(testConfig.importDir, testConfig.importDir_options)
        .then((resp) => {
            assert(resp == dirEntries.length, `expected resp to be ${testConfig.importFiles.length}`)
            done()
        })
        .catch(done)
    });

    it('shall successfully disconnect from mongodb', function(done){
        mongoImporter.disconnect()
        .then(done, done);
    });
})
