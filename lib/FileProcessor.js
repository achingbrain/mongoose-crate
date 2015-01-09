
var FileProcessor = function() {

}

FileProcessor.prototype.createFieldSchema = function() {
  return {
    size: Number,
    name: String,
    type: {
      type: String
    },
    url: String
  }
}

FileProcessor.prototype.process = function(attachment, storageProvider, model, callback) {
  storageProvider.save(attachment, function(error, url) {
    model.size = attachment.size
    model.name = attachment.name
    model.type = attachment.type
    model.url = url

    callback(error)
  })
}

FileProcessor.prototype.willOverwrite = function(model) {
  return !!model.url
}

FileProcessor.prototype.remove = function(storageProvider, model, callback) {
  if(!model.url) {
    return callback()
  }

  storageProvider.remove(model, callback)
}

module.exports = FileProcessor
