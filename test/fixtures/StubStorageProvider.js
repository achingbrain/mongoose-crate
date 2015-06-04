var util = require('util'),
  StorageProvider = require('../../lib/StorageProvider')

var StubStorageProvider = function() {
  StorageProvider.call(this)
}
util.inherits(StubStorageProvider, StorageProvider)

StubStorageProvider.prototype.save = function(path, callback) {
  callback(null, path)
}

StubStorageProvider.prototype.remove = function(attachment, callback) {
  callback()
}

module.exports = StubStorageProvider