'use strict'

const should = require('should')
const sinon = require('sinon')
const path = require('path')
const os = require('os')
const mongoose = require('mongoose')
const mockgoose = require('mockgoose')
const async = require('async')
const Crate = require('../lib/Crate')
const createSchema = require('./fixtures/StubSchema')
const createSchemaWithArrayProperty = require('./fixtures/StubSchemaWithArrayProperty')
const createSchemaWithFileProcessor = require('./fixtures/StubSchemaWithFileProcessor')
const createSchemaWithUnselectedName = require('./fixtures/StubSchemaWithUnselectedName')
const describe = require('mocha').describe
const before = require('mocha').before
const it = require('mocha').it

describe('Crate', () => {
  before((done) => {
    mockgoose(mongoose).then(() => {
      mongoose.Promise = Promise
      mongoose.connect('mongodb://crate/testdb', done)
    })
  })

  it('should attach a file', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema) => {
      var model = new StubSchema()
      model.attach('file', {
        path: file
      }, (error) => {
        should(error).not.ok

        model.file.type.should.equal('image/png')
        model.file.name.should.equal('node_js_logo.png')
        model.file.url.should.be.ok

        // this can vary depending on file system...
        model.file.size.should.be.greaterThan(17000)

        done()
      })
    })
  })

  it('should attach a file and override parameters', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema) => {
      var model = new StubSchema()
      model.attach('file', {
        path: file,
        type: 'foo/bar',
        name: 'hello',
        size: 5
      }, function (error) {
        should(error).not.ok

        model.file.type.should.equal('foo/bar')
        model.file.name.should.equal('hello')
        model.file.size.should.equal(5)
        model.file.url.should.be.ok

        done()
      })
    })
  })

  it('should attach a file to an array', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchemaWithArrayProperty((StubSchema) => {
      var model = new StubSchema()

      model.files.length.should.equal(0)
      model.attach('files', {
        path: file
      }, function (error) {
        should(error).not.ok

        model.files.length.should.equal(1)

        done()
      })
    })
  })

  it('should error on non attachment field', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema) => {
      var model = new StubSchema()
      model.attach('foo', {
        path: file
      }, function (error) {
        error.should.be.ok

        done()
      })
    })
  })

  it('should error on non attachment field and return a promise', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema) => {
      var model = new StubSchema()
      model.attach('foo', {
        path: file
      })
      .catch(error => {
        error.should.be.ok

        done()
      })
    })
  })

  it('should error when attachment path is missing', (done) => {
    createSchema((StubSchema) => {
      var model = new StubSchema()
      model.attach('file', {}, function (error) {
        error.should.be.ok

        done()
      })
    })
  })

  it('should error when attachment path is missing and return a promise', (done) => {
    createSchema((StubSchema) => {
      var model = new StubSchema()
      model.attach('file', {})
      .catch(error => {
        error.should.be.ok

        done()
      })
    })
  })

  it('should error on non-existent file', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'foo.png'))

    createSchema((StubSchema) => {
      var model = new StubSchema()
      model.attach('file', {
        path: file
      }, (error) => {
        error.should.be.ok

        done()
      })
    })
  })

  it('should error on non-existent file and return a promise', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'foo.png'))

    createSchema((StubSchema) => {
      var model = new StubSchema()
      model.attach('file', {
        path: file
      })
      .catch(error => {
        error.should.be.ok

        done()
      })
    })
  })

  it('should remove attachment when model is deleted', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema, storage) => {
      var model = new StubSchema()
      model.attach('file', {
        path: file
      }, (error) => {
        should(error).not.ok

        storage.remove.callCount.should.equal(0)

        model.remove()

        storage.remove.callCount.should.equal(1)

        done()
      })
    })
  })

  it('should remove attachment when model is loaded and deleted', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema, storage) => {
      var model = new StubSchema()
      model.name = 'foo'
      model.attach('file', {
        path: file
      }, (error) => {
        should(error).not.ok

        // save the model
        model.save((error) => {
          should(error).not.ok

          // load a new copy of the model
          StubSchema.findById(model.id, (error, result) => {
            should(error).not.ok;

            // should not be the same object
            (model === result).should.be.false

            // but the ids should be the same
            model.id.should.equal(result.id)
            model = result

            storage.remove.callCount.should.equal(0)

            model.remove()

            storage.remove.callCount.should.equal(1)

            done()
          })
        })
      })
    })
  })

  it('should remove attachment array when model is deleted', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchemaWithArrayProperty((StubSchema, storage) => {
      var model = new StubSchema()
      model.attach('files', {
        path: file
      }, (error) => {
        should(error).not.ok

        model.attach('files', {
          path: file
        }, error => {
          should(error).not.ok
          storage.remove.callCount.should.equal(0)

          model.remove(error => {
            should(error).not.ok
            storage.remove.callCount.should.equal(2)

            done()
          })
        })
      })
    })
  })

  it('should remove attachment array when model is deleted and return a promise', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchemaWithArrayProperty((StubSchema, storage) => {
      var model = new StubSchema()
      model.attach('files', {
        path: file
      }, (error) => {
        should(error).not.ok

        model.attach('files', {
          path: file
        })
        .then(() => {
          storage.remove.callCount.should.equal(0)

          return model.remove()
        }).then(() => {
          storage.remove.callCount.should.equal(2)

          done()
        })
      })
    })
  })

  it('should remove attachment when model is updated', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, (callback) => {
        // file url should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should have persisted the file url in the previous step
          model.file.url.should.be.ok

          callback(error)
        })
      }, (callback) => {
        // overwrite the file property
        model.attach('file', {
          path: file
        }, callback)
      }, (callback) => {
        // and save the model again
        model.save(callback)
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        // should have removed the old attachment
        storage.remove.callCount.should.equal(1)

        // and stored the old and new ones
        storage.save.callCount.should.equal(2)

        done()
      })
    })
  })

  it('should remove attachment from array field when model is updated', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchemaWithArrayProperty((StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('files', {
          path: file
        }, callback)
      }, (callback) => {
        // create our model and attach another file
        model.name = 'hello'
        model.attach('files', {
          path: file
        }, callback)
      }, (callback) => {
        // file urls should have been populated
        model.files.length.should.equal(2)
        model.files[0].url.should.be.ok
        model.files[1].url.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should have persisted the file url in the previous step
          model.files.length.should.equal(2)
          model.files[0].url.should.be.ok
          model.files[1].url.should.be.ok

          callback(error)
        })
      }, (callback) => {
        // remove one of the files
        model.files.shift()

        // and save the model again
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should only have one file now
          model.files.length.should.equal(1)
          model.files[0].url.should.be.ok

          callback(error)
        })
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(2)

        // but removed one of them
        storage.remove.callCount.should.equal(1)

        // so we should only have one file
        model.files.length.should.equal(1)

        done()
      })
    })
  })

  it('should remove attachment when attachment is deleted', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, (callback) => {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, (callback) => {
        // remove the file
        model.file = null

        // and save the model again
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should have removed field
          should(model.file.url).not.ok

          callback(error)
        })
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // and also removed one of them
        storage.remove.callCount.should.equal(1)

        done()
      })
    })
  })

  it('should not remove attachment when model is modified but attachment is not modified', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, (callback) => {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, (callback) => {
        // remove the file
        model.name = 'something else'

        // and save the model again
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should have removed field
          should(model.file.url).ok

          callback(error)
        })
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // but not removed it
        storage.remove.callCount.should.equal(0)

        done()
      })
    })
  })

  it('should remove attachment when attachment is deleted from model with file processor and multiple transforms', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    var fileProcessor = {
      createFieldSchema: sinon.stub(),
      willOverwrite: sinon.stub(),
      shouldRemove: sinon.stub(),
      remove: sinon.stub()
    }
    fileProcessor.createFieldSchema.returns({
      foo: {},
      bar: {}
    })
    fileProcessor.process = (attachment, storageProvider, model, callback) => {
      storageProvider.save(attachment, (error, url) => {
        ['foo', 'bar'].forEach((property) => {
          model[property] = {
            size: attachment.size,
            name: attachment.name,
            type: attachment.type,
            url: url
          }
        })

        callback(error)
      })
    }
    fileProcessor.shouldRemove.returns(true)
    fileProcessor.remove.callsArg(2)

    createSchemaWithFileProcessor(fileProcessor, (StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, (callback) => {
        // file urls should have been populated
        model.file.foo.should.be.ok
        model.file.bar.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, (callback) => {
        // remove the files
        model.file = null

        // and save the model again
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should have removed field
          should(model.file.foo).not.ok
          should(model.file.bar).not.ok

          callback(error)
        })
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // and also removed one of them
        fileProcessor.remove.callCount.should.equal(1)

        done()
      })
    })
  })

  it('should have an attach method', (done) => {
    createSchema((StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.save(callback)
      }, (callback) => {
        StubSchema.findById(model.id).exec((error, result) => {
          should(error).not.ok
          should(result.attach).not.be.null

          callback()
        })
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        done()
      })
    })
  })

  it('should be able to remove attachment, save and add a new attachment', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, (callback) => {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          should(error).not.ok;

          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, (callback) => {
        // remove the file
        model.file = null

        // and save the model again
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          should(error).not.ok;

          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should have removed field
          should(model.file.url).not.ok

          // add an upload again
          model.attach('file', {
            path: file
          }, callback)
        })
      }, (callback) => {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should have the second uploaded file
          should(model.file.url).ok

          callback(error)
        })
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(2)

        // and also removed one of them
        storage.remove.callCount.should.equal(1)

        done()
      })
    })
  })

  it('should not block if url field is blank', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchema((StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, (callback) => {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, (error, result) => {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, (callback) => {
        // remove the file
        model.file.url = null
        model.remove(callback)
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // and also removed one of them
        storage.remove.callCount.should.equal(0)

        done()
      })
    })
  })

  it('should survive a non-selected name property', (done) => {
    const file = path.resolve(path.join(__dirname, '.', 'fixtures', 'node_js_logo.png'))

    createSchemaWithUnselectedName((StubSchema, storage) => {
      var model = new StubSchema()
      var tasks = [(callback) => {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('files', {
          path: file
        }, callback)
      }, (callback) => {
        // file urls should have been populated
        model.files[0].url.should.be.ok

        // save the model
        model.save(callback)
      }, (callback) => {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findOne({
          _id: model.id
        }).select('name')
          .exec((error, doc) => {
            should(error).not.ok
            doc.save(callback)
          })
      }]

      async.series(tasks, (error) => {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // and also removed one of them
        storage.remove.callCount.should.equal(0)

        done()
      })
    })
  })

  it('should use os temp dir if not passed as an option', function () {
    var crate = new Crate()
    var options = {
      fields: {}
    }

    crate._validateOptions(options)

    options.tempDir.should.equal(os.tmpdir())
  })

  it('should use passed temp dir', function () {
    var crate = new Crate()
    var tempDir = 'foo'
    var options = {
      fields: {},
      tempDir: tempDir
    }

    crate._validateOptions(options)

    options.tempDir.should.equal(tempDir)
  })
})
