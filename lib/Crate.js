var os = require('os'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  mmm = require('mmmagic'),
  Magic = mmm.Magic,
  check = require('check-types'),
  StorageProvider = require('./StorageProvider'),
  FileProcessor = require('./FileProcessor')

var Crate = function() {
  this._magic = new Magic(mmm.MAGIC_MIME_TYPE)
}

Crate.prototype._addFields = function(schema, options) {
  var fields = {}

  Object.keys(options.fields).forEach(function(field) {
    fields[field] = options.fields[field].processor.createFieldSchema()

    if(options.fields[field].array) {
      fields[field] = [fields[field]]
    }
  })

  schema.add(fields)
}

Crate.prototype._validateOptions = function(options) {
  check.verify.object(options, 'No options were specified!')
  check.verify.object(options.fields, 'No fields were specified!')

  if(!options.tempDir) {
    options.tempDir = os.tmpdir()
  }

  Object.keys(options.fields).forEach(function(field) {
    if(!options.fields[field].processor) {
      options.fields[field].processor = new FileProcessor()
    }

    check.verify.fn(options.fields[field].processor.createFieldSchema, 'FileProcessor object should implement the createFieldSchema method!')
    check.verify.fn(options.fields[field].processor.willOverwrite, 'FileProcessor object should implement the willOverwrite method!')
    check.verify.fn(options.fields[field].processor.process, 'FileProcessor object should implement the process method!')
    check.verify.fn(options.fields[field].processor.remove, 'FileProcessor object should implement the remove method!')
  })
}

Crate.prototype._validateProvider = function(options) {
  check.verify.object(options.storage, 'Please pass a StorageProvider!')
  check.verify.fn(options.storage.save, 'Storage object should implement the save method!')
  check.verify.fn(options.storage.remove, 'Storage object should implement the remove method!')
}

Crate.prototype.plugin = function(schema, options) {
  this._validateOptions(options)
  this._validateProvider(options)
  this._addFields(schema, options)

  var self = this

  schema.methods.attach = function(field, attachment, callback) {
    if(!options.fields[field]) {
      return callback(new Error('Field "' + field + '" was not registered as an attachment property'))
    }

    if(!attachment || !attachment.path) {
      return callback(new Error('Attachment has no path property!'))
    }

    var model = this

    if(options.fields[field].array) {
      var modelArray = this[field]
      model = {}
      model[field] = this[field].create()
    }

    // the things we will do to the file
    var tasks = []

    // make sure the file actually exists
    tasks.push(function(callback) {
      fs.exists(attachment.path, function(result) {
        callback(!result ? new Error('No file exists at ' + attachment.path) : undefined)
      })
    })

    // make sure there's a mimetype
    if(!attachment.type) {
      tasks.push(function(callback) {
        self._magic.detectFile(attachment.path, function(error, type) {
          attachment.type = type
          callback(error)
        })
      }.bind(this))
    }

    // make sure there's an original name
    if(!attachment.name) {
      tasks.push(function(callback) {
        attachment.name = path.basename(attachment.path)
        callback()
      }.bind(this))
    }

    // get the filesize
    if(!attachment.size) {
      tasks.push(function(callback) {
        fs.stat(attachment.path, function(error, stats) {
          attachment.size = stats.size
          callback(error)
        })
      })
    }

    // remove the old file if one already exists
    if(options.fields[field].processor.willOverwrite(model[field])) {
      tasks.push(function(callback) {
        options.fields[field].processor.remove(options.storage, model[field], callback)
      })
    }

    // process the attachment
    tasks.push(function(callback) {
      options.fields[field].processor.process(attachment, options.storage, model[field], callback)
    })

    async.series(tasks, function(error) {
      if(error) {
        return callback(error)
      }

      if(options.fields[field].array) {
        modelArray.push(model[field])
      }

      callback()
    })
  }

  // register a hook to clean up files before models are deleted
  schema.pre('remove', function(next) {
    var model = this
    var tasks = []

    Object.keys(options.fields).forEach(function(field) {
      if(options.fields[field].array) {
        model[field].forEach(function(arrayField) {
          tasks.push(function(callback) {
            options.fields[field].processor.remove(options.storage, arrayField, callback)
          })
        })
      } else {
        tasks.push(function(callback) {
          options.fields[field].processor.remove(options.storage, model[field], callback)
        })
      }
    })

    async.parallel(tasks, function(error) {
      next(error)
    })
  })

  schema.virtual('__cached_attachments').get(function() {
    return this.___cached_attachments
  })

  schema.virtual('__cached_attachments').set(function(value) {
    return this.___cached_attachments = value
  })

  // store a copy of every attachment property
  schema.post('init', function() {
    var model = this.toObject()
    this.__cached_attachments = {}

    Object.keys(options.fields).forEach(function(field) {
      if(model[field]) {
        this.__cached_attachments[field] = JSON.parse(JSON.stringify(model[field]))
      }
    }.bind(this))
  })

  // before saving, tidy up any attachments that have been deleted
  schema.pre('save', function (next) {
    var model = this
    var tasks = []

    if(!model.__cached_attachments) {
      return next()
    }

    Object.keys(options.fields).forEach(function(field) {
      if(options.fields[field].array) {
        // deal with attachments that have been deleted from arrays
        model.__cached_attachments[field].forEach(function(oldDoc) {
          var present = false

          model[field].forEach(function (currentDoc) {
            if(currentDoc._id.equals(oldDoc._id)) {
              present = true
            }
          })

          if(!present) {
            // subDocument has been removed, delete the attachment
            tasks.push(function (callback) {
              options.fields[field].processor.remove(options.storage, oldDoc, callback)
            })
          }
        })
      } else {
        // if the attachment has been modified and there was an old one, remove the old version
        if(model.isModified(field) && model.__cached_attachments[field]) {
          tasks.push(function (callback) {
            options.fields[field].processor.remove(options.storage, model.__cached_attachments[field], callback)
          })
        }
      }
    })

    async.parallel(tasks, function(error) {
      if(error) {
        throw error
      }

      next()
    })
  })
}

module.exports = Crate
