var regex = new RegExp(/(:[^/-]+)/)
  , path = require('path')

var reservedKeysForModel = {
  modelName: function (model) { return model.constructor.modelName },
  collectionName: function (model) { return model.constructor.collection.name }
}

var valueFromReservedKeyForModel = function(key, model){
  return reservedKeysForModel[key] && reservedKeysForModel[key](model)
}

var valueFromReservedKeyForField = function(key, field){
  return key == 'fieldName' ? field : undefined
}

var reservedKeysForAttachment = {
  attachmentName: function (attachment) {
    return path.basename(attachment.name).replace(path.extname(attachment.name), '')
  },
  attachmentSize: function (attachment) {
    return attachment.size
  }
}

var valueFromReservedKeyForAttachment = function(key, attachment){
  return reservedKeysForAttachment[key] && reservedKeysForAttachment[key](attachment)
}

module.exports = function (model, field, attachment, format, callback) {
  if (!model) { return callback(new Error('model is required')) }
  if (!field) { return callback(new Error('field is required')) }
  if (!attachment) { return callback(new Error('attachment is required')) }
  if (!format) { return callback(new Error('format is required')) }

  while (regex.test(format)) {
    var match = regex.exec(format)[0]
      , key = match.slice(1)

    var value = valueFromReservedKeyForModel(key, model)
              || valueFromReservedKeyForField(key, field)
              || valueFromReservedKeyForAttachment(key, attachment)
              || model[key]

    if (value instanceof Function) { value = value() }
    if (value instanceof Date) { value = value.getTime() }
    if (!value) { return callback(new Error(match + ' resolved to a falsey value')) }
    if (Array.isArray(value)) { return callback(new Error(match + ' returned unsupported type Array')) }

    value = value.toString()

    if (value == '[object Object]') { return callback(new Error(match + ' returned unsupported type Object')) }

    format = format.replace(match, value)
  }

  callback(undefined, format + path.extname(attachment.name))
}
