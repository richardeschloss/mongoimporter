# mongoimporter
Import csv and json files into mongo DB. The existing mongoimport binary is great, this project is a library to be a bit more flexible for programmatic use.

This library can import multiple files or an entire directory at once. If importing the entire directory, it will only import files in that directory (not subdirectories).

The destination collection names can either be explicitly stated or inferred from each filename using the useFilename option. See test/index.js for examples.

# Examples
1. Importing multiple files (mixed filetypes, csv or json) into mongodb:
```javascript
/* Requires */
const MongoImporter = require('mongoimporter')

/* Instantiate the mongoImporter */
const mongoImporter = new MongoImporter({
    dbName: 'test',
    dbUser: 'test1',
    dbPass: 'test1'
})

var files = [
    './datasets/example1.csv',
    './datasets/example2.csv',
    './datasets/example3.json',
    './datasets/example4.json',
]

mongoImporter
.connect() // Connect to the db first
.then(() => {
    mongoImporter.importFiles(files, { // import files
        csvDelimiter: ',', // Delimiter to use for csv files
        collectionName: { // Set collectionName to an object
            useFilename: true // The filename will be used as the collectionName
        },
        headerline: true // Use the headerline as fields
    })
    .then((filesImported) => {
        console.log('filesImported', filesImported)
        mongoImporter.disconnect(); // disconnect from the db
    })
})
```

2. Import a directory into mongodb. Suppose the directory "datasets" consists of the files from example 1. Then the code would be simplified to this:
```javascript
/* Requires */
const MongoImporter = require('mongoimporter')

/* Instantiate the mongoImporter */
const mongoImporter = new MongoImporter({
    dbName: 'test',
    dbUser: 'test1',
    dbPass: 'test1'
})

var dir = 'datasets';

mongoImporter
.connect() // Connect to the db first
.then(() => {
    mongoImporter.importDir(dir, { // import directory
        csvDelimiter: ',', // Delimiter to use for csv files
        collectionName: dir, // Setting the collectionName to directory name explicitly (but it can be any string you want)
        headerline: true // Use the headerline as fields
    })
    .then(() => {
        console.log('dirImported') // If we got here, we succeeded
        mongoImporter.disconnect(); // disconnect from the db
    }, (err) => {
        console.log('dirImport failed', err) // If we got here, we failed...read the err.
        mongoImporter.disconnect(); // disconnect from the db
    })
})
```

(This is still in it's early stage...Tests pass and this code works, but patience requested for perhaps more advanced tasks.)
