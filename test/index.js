/* Requires */
const assert = require('assert');
const MongoImporter = require('../src/index');
const testConfig = require('../testConfig.json')

describe('importFiles', function(){
    console.log('testConfig', testConfig)
    const mongoImporter = new MongoImporter(testConfig.mongoClient)
    it('shall successfully connect to mongodb', function(done){
        mongoImporter.connect(testConfig.mongoClient.connectOptions)
        .then((resp) => {
            console.log('connected to mongoDB')
            done();
        }, done)
    })

    it('shall import multiple csv and json files into mongodb', function(done){
        mongoImporter.importFiles(testConfig.importFiles, testConfig.importFiles_options)
        .then((resp) => {
            done()
        },done);
    })

    it('shall import files from a specified directory into mongodb', function(done){
        mongoImporter.importDir(testConfig.importDir, testConfig.importDir_options)
        .then((resp) => {
            done()
        },done);
    });

    it('shall successfully disconnect from mongodb', function(done){
        mongoImporter.disconnect()
        .then(done,done);
    });
})
