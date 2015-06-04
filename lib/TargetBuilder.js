var regex = new RegExp(/(:[^/-]+)/)
  , path = require('path')

var stringifyType = function(value) {
  if (value instanceof Date) {
    return value.getTime()
  }
  else if (value instanceof Function) {
    return value()
  }
  else {
    return value.toString()
  }
}

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

module.exports = function (model, field, attachment, format) {
  if (!model) { throw new Error('model is required') }
  if (!field) { throw new Error('field is required') }
  if (!attachment) { throw new Error('attachment is required') }
  if (!format) { throw new Error('format is required') }

  while (regex.test(format)) {
    var match = regex.exec(format)[0]
      , key = match.slice(1)

    // use the virtual since BSON IDs are Objects
    key = key == '_id' ? 'id' : key

    var value =  valueFromReservedKeyForModel(key, model)
              || valueFromReservedKeyForField(key, field)
              || valueFromReservedKeyForAttachment(key, attachment)
              || model[key]

    if (!value) { throw new Error(match + ' does not resolve to a value') }
    if (Array.isArray(value)) { throw new Error(match + ' returned unsupported type Array') }
    value = stringifyType(value)

    format = format.replace(match, value)
  }

  return format + path.extname(attachment.name)
}
