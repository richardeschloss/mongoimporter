const MongoImporter = require('../src/index')

const testConfig = require('../testConfig.json')

console.log('testConfig', testConfig)

const mongoImporter = new MongoImporter(testConfig.mongoClient)
mongoImporter.connect(testConfig.mongoClient.connectOptions)
.then((resp) => mongoImporter.importFiles(testConfig.importFiles, testConfig.importFiles_options))
.then(console.log)
.catch(console.error)
.finally(() => mongoImporter.disconnect() )
