
var StorageProvider = function() {

}

StorageProvider.prototype.save = function(path, callback) {
  throw new Error('StorageProvider#save not implemented')
}

StorageProvider.prototype.remove = function(attachment, callback) {
  throw new Error('StorageProvider#remove not implemented')
}

module.exports = StorageProvider
