'use strict'

const os = require('os')
const fs = require('fs')
const path = require('path')
const async = require('async')
const mmm = require('mmmagic')
const Magic = mmm.Magic
const check = require('check-types')
const FileProcessor = require('./FileProcessor')

class Crate {
  constructor () {
    this._magic = new Magic(mmm.MAGIC_MIME_TYPE)
  }

  _addFields (schema, options) {
    const fields = {}

    Object.keys(options.fields).forEach((field) => {
      fields[field] = options.fields[field].processor.createFieldSchema()

      if (options.fields[field].array) {
        fields[field] = [fields[field]]
      }
    })

    schema.add(fields)
  }

  _validateOptions (options) {
    check.assert.object(options, 'No options were specified!')
    check.assert.object(options.fields, 'No fields were specified!')

    if (!options.tempDir) {
      options.tempDir = os.tmpdir()
    }

    Object.keys(options.fields).forEach((field) => {
      if (!options.fields[field].processor) {
        options.fields[field].processor = new FileProcessor()
      }

      check.assert.function(options.fields[field].processor.createFieldSchema, 'FileProcessor object should implement the createFieldSchema method!')
      check.assert.function(options.fields[field].processor.willOverwrite, 'FileProcessor object should implement the willOverwrite method!')
      check.assert.function(options.fields[field].processor.process, 'FileProcessor object should implement the process method!')
      check.assert.function(options.fields[field].processor.remove, 'FileProcessor object should implement the remove method!')
    })
  }

  _validateProvider (options) {
    check.assert.object(options.storage, 'Please pass a StorageProvider!')
    check.assert.function(options.storage.save, 'Storage object should implement the save method!')
    check.assert.function(options.storage.remove, 'Storage object should implement the remove method!')
  }

  plugin (schema, options) {
    this._validateOptions(options)
    this._validateProvider(options)
    this._addFields(schema, options)

    const self = this

    schema.methods.attach = function (field, attachment, callback) {
      if (!options.fields[field]) {
        const error = new Error('Field "' + field + '" was not registered as an attachment property')

        if (callback) {
          return callback(error)
        }

        return Promise.reject(error)
      }

      if (!attachment || !attachment.path) {
        const error = new Error('Attachment has no path property!')

        if (callback) {
          return callback(error)
        }

        return Promise.reject(error)
      }

      let model = this
      let modelArray

      if (options.fields[field].array) {
        modelArray = this[field]
        model = {}
        model[field] = this[field].create()
      }

      // the things we will do to the file
      const tasks = []

      // make sure the file actually exists
      tasks.push(next => {
        fs.exists(attachment.path, function (result) {
          next(!result ? new Error('No file exists at ' + attachment.path) : undefined)
        })
      })

      // make sure there's a mimetype
      if (!attachment.type) {
        tasks.push(next => {
          self._magic.detectFile(attachment.path, (error, type) => {
            attachment.type = type
            next(error)
          })
        })
      }

      // make sure there's an original name
      if (!attachment.name) {
        tasks.push(next => {
          attachment.name = path.basename(attachment.path)
          next()
        })
      }

      // get the filesize
      if (!attachment.size) {
        tasks.push(next => {
          fs.stat(attachment.path, (error, stats) => {
            attachment.size = stats.size
            next(error)
          })
        })
      }

      // remove the old file if one already exists
      if (options.fields[field].processor.willOverwrite(model[field])) {
        tasks.push(next => {
          options.fields[field].processor.remove(options.storage, model[field], next)
        })
      }

      // process the attachment
      tasks.push(next => {
        options.fields[field].processor.process(attachment, options.storage, model[field], next)
      })

      const attach = next => {
        async.series(tasks, (error) => {
          if (error) {
            return next(error)
          }

          if (options.fields[field].array) {
            modelArray.push(model[field])
          }

          next()
        })
      }

      if (!callback) {
        return new Promise((resolve, reject) => {
          attach((error) => {
            if (error) {
              return reject(error)
            }

            resolve()
          })
        })
      }

      attach(callback)
    }

    // register a hook to clean up files before models are deleted
    schema.pre('remove', function (next) {
      const model = this
      const tasks = []

      Object.keys(options.fields).forEach((field) => {
        if (options.fields[field].array) {
          model[field].forEach((arrayField) => {
            tasks.push((callback) => {
              options.fields[field].processor.remove(options.storage, arrayField, callback)
            })
          })
        } else {
          tasks.push((callback) => {
            options.fields[field].processor.remove(options.storage, model[field], callback)
          })
        }
      })

      async.parallel(tasks, function (error) {
        next(error)
      })
    })

    schema.virtual('__cached_attachments').get(function () {
      return this.___cached_attachments
    })

    schema.virtual('__cached_attachments').set(function (value) {
      this.___cached_attachments = value
    })

    // store a copy of every attachment property
    schema.post('init', (doc) => {
      const model = doc.toObject()
      doc.__cached_attachments = {}

      Object.keys(options.fields).forEach((field) => {
        if (model[field]) {
          doc.__cached_attachments[field] = JSON.parse(JSON.stringify(model[field]))
        }
      })
    })

    // before saving, tidy up any attachments that have been deleted
    schema.pre('save', function (next) {
      const model = this
      const tasks = []

      if (!model.__cached_attachments) {
        return next()
      }

      Object.keys(options.fields).forEach((field) => {
        if (!model.__cached_attachments[field]) {
          return
        }

        if (options.fields[field].array) {
          // deal with attachments that have been deleted from arrays
          model.__cached_attachments[field].forEach((oldDoc) => {
            let present = false

            model[field].forEach((currentDoc) => {
              if (currentDoc._id.equals(oldDoc._id)) {
                present = true
              }
            })

            if (!present) {
              // subDocument has been removed, delete the attachment
              tasks.push((callback) => {
                options.fields[field].processor.remove(options.storage, oldDoc, callback)
              })
            }
          })
        } else if (model.isModified(field)) {
          // if the attachment has been modified and there was an old one, remove the old version
          tasks.push((callback) => {
            options.fields[field].processor.remove(options.storage, model.__cached_attachments[field], callback)
          })
        }
      })

      async.parallel(tasks, (error) => {
        next(error)
      })
    })
  }
}

module.exports = Crate
