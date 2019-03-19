const MongoImporter = require('../src/index')

const testConfig = require('../testConfig.json')

console.log('testConfig', testConfig)

const mongoImporter = new MongoImporter(testConfig.mongoClient)
mongoImporter.connect(testConfig.mongoClient.connectOptions)
.then((resp) => {
    console.log('connected to db!')
    return mongoImporter.importDir(testConfig.importDir, testConfig.importDir_options)
})
.then(console.log)
.catch(console.error)
.finally(() => {
    console.log('finally block...')
    mongoImporter.disconnect();
})
