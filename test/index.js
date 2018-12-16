const mongoimport = require('../src/index')

const importer = new mongoimport({
    dbName: 'test',
    collections: ['test'],
    headerline: true
})

importer.importFile('./datasets/example1.csv', {
    csvDelimiter: ','
})
