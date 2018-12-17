# mongoimporter
Import csv and json files into mongo DB. The existing mongoimport binary is great, this project is a library to be a bit more flexible for programmatic use.

This library can import multiple files or an entire directory at once. If importing the entire directory, it will only import files in that directory (not subdirectories).

The destination collection names can either be explicitly stated or inferred from each filename using the useFilename option. See test/index.js for examples.

# Examples
[To come]

(This is still in it's early stage...Tests pass and this code works, but patience requested for perhaps more advanced tasks.)
