var Crate = require('./lib/Crate'),
  StorageProvider = require('./lib/StorageProvider'),
  FileProcessor = require('./lib/FileProcessor')

var crate = new Crate()

module.exports = exports = crate.plugin.bind(crate)
module.exports.StorageProvider = StorageProvider
module.exports.FileProcessor = FileProcessor
