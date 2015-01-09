var should = require('should'),
  sinon = require('sinon'),
  path = require('path'),
  os = require('os'),
  fs = require('fs'),
  tungus = require('tungus'),
  mongoose = require('mongoose'),
  async = require('async'),
  randomString = require('./fixtures/randomString'),
  Crate = require('../lib/Crate'),
  createSchema = require('./fixtures/StubSchema'),
  createSchemaWithArrayProperty = require('./fixtures/StubSchemaWithArrayProperty'),
  createSchemaWithFileProcessor = require('./fixtures/StubSchemaWithFileProcessor'),
  createSchemaWithUnselectedName = require('./fixtures/StubSchemaWithUnselectedName')

describe('Crate', function() {

  before(function(done) {
    var dataDirectory = path.join(os.tmpdir(), randomString(10))
    fs.mkdirSync(dataDirectory)
    mongoose.connect('tingodb://' + dataDirectory)

    done()
  })

  it('should attach a file', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema) {
      var model = new StubSchema()
      model.attach('file', {
        path: file
      }, function (error) {
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

  it('should attach a file to an array', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchemaWithArrayProperty(function(StubSchema) {
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

  it('should error on non attachment field', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema) {
      var model = new StubSchema()
      model.attach('foo', {
        path: file
      }, function (error) {
        error.should.be.ok

        done()
      })
    })
  })

  it('should error when attachment path is missing', function(done) {
    createSchema(function(StubSchema) {
      var model = new StubSchema()
      model.attach('file', {}, function (error) {
        error.should.be.ok

        done()
      })
    })
  })

  it('should error on non-existent file', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/foo.png')

    createSchema(function(StubSchema) {
      var model = new StubSchema()
      model.attach('file', {
        path: file
      }, function(error) {
        error.should.be.ok

        done()
      })
    })
  })

  it('should remove attachment when model is deleted', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema, storage) {
      var model = new StubSchema()
      model.attach('file', {
        path: file
      }, function(error) {
        should(error).not.ok

        storage.remove.callCount.should.equal(0)

        model.remove()

        storage.remove.callCount.should.equal(1)

        done()
      })
    })
  })

  it('should remove attachment when model is loaded and deleted', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema, storage) {
      var model = new StubSchema()
      model.name = 'foo'
      model.attach('file', {
        path: file
      }, function(error) {
        should(error).not.ok

        // save the model
        model.save(function(error) {
          should(error).not.ok

          // load a new copy of the model
          StubSchema.findById(model.id, function(error, result) {
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

  it('should remove attachment array when model is deleted', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchemaWithArrayProperty(function(StubSchema, storage) {
      var model = new StubSchema()
      model.attach('files', {
        path: file
      }, function(error) {
        should(error).not.ok

        model.attach('files', {
          path: file
        }, function(error) {
          should(error).not.ok

          storage.remove.callCount.should.equal(0)

          model.remove()

          storage.remove.callCount.should.equal(2)

          done()
        })
      })
    })
  })

  it('should remove attachment when model is updated', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, function(callback) {
        // file url should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          // should have persisted the file url in the previous step
          model.file.url.should.be.ok

          callback(error)
        })
      }, function(callback) {
        // overwrite the file property
        model.attach('file', {
          path: file
        }, callback)
      }, function(callback) {
        // and save the model again
        model.save(callback)
      }]

      async.series(tasks, function(error) {
        should(error).not.ok

        // should have removed the old attachment
        storage.remove.callCount.should.equal(1)

        // and stored the old and new ones
        storage.save.callCount.should.equal(2)

        done()
      })
    })
  })

  it('should remove attachment from array field when model is updated', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchemaWithArrayProperty(function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('files', {
          path: file
        }, callback)
      }, function(callback) {
        // create our model and attach another file
        model.name = 'hello'
        model.attach('files', {
          path: file
        }, callback)
      }, function(callback) {
        // file urls should have been populated
        model.files.length.should.equal(2)
        model.files[0].url.should.be.ok
        model.files[1].url.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
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
      }, function(callback) {
        // remove one of the files
        model.files.shift()

        // and save the model again
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
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

      async.series(tasks, function(error) {
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

  it('should remove attachment when attachment is deleted', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, function(callback) {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, function(callback) {
        // remove the file
        model.file = null

        // and save the model again
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
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

      async.series(tasks, function(error) {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // and also removed one of them
        storage.remove.callCount.should.equal(1)

        done()
      })
    })
  })

  it('should not remove attachment when model is modified but attachment is not modified', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, function(callback) {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, function(callback) {
        // remove the file
        model.name = 'something else'

        // and save the model again
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
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

      async.series(tasks, function(error) {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // but not removed it
        storage.remove.callCount.should.equal(0)

        done()
      })
    })
  })

  it('should remove attachment when attachment is deleted from model with file processor and multiple transforms', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

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
    fileProcessor.process = function(attachment, storageProvider, model, callback) {
      storageProvider.save(attachment, function(error, url) {
        ['foo', 'bar'].forEach(function(property) {
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

    createSchemaWithFileProcessor(fileProcessor, function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, function(callback) {
        // file urls should have been populated
        model.file.foo.should.be.ok
        model.file.bar.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, function(callback) {
        // remove the files
        model.file = null

        // and save the model again
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
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

      async.series(tasks, function(error) {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // and also removed one of them
        fileProcessor.remove.callCount.should.equal(1)

        done()
      })
    })
  })

  it('should have an attach method', function(done) {

    createSchema(function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.save(callback)
      }, function(callback) {

        StubSchema.findById(model.id).exec(function(error, result) {
          should(result.attach).not.be.null

          callback()
        })
      }]

      async.series(tasks, function(error) {
        should(error).not.ok

        done()
      })
    })
  })

  it('should be able to remove attachment, save and add a new attachment', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, function(callback) {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, function(callback) {
        // remove the file
        model.file = null

        // and save the model again
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
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
      }, function(callback) {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
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

      async.series(tasks, function(error) {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(2)

        // and also removed one of them
        storage.remove.callCount.should.equal(1)

        done()
      })
    })
  })

  it('should not block if url field is blank', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchema(function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('file', {
          path: file
        }, callback)
      }, function(callback) {
        // file urls should have been populated
        model.file.url.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findById(model.id, function(error, result) {
          // should not be the same object
          (model === result).should.be.false

          // but the ids should be the same
          model.id.should.equal(result.id)
          model = result

          callback(error)
        })
      }, function(callback) {
        // remove the file
        model.file.url = null
        model.remove(callback)
      }]

      async.series(tasks, function(error) {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // and also removed one of them
        storage.remove.callCount.should.equal(0)

        done()
      })
    })
  })

  it('should survive a non-selected name property', function(done) {
    var file = path.resolve(__dirname + '/./fixtures/node_js_logo.png')

    createSchemaWithUnselectedName(function(StubSchema, storage) {
      var model = new StubSchema()
      var tasks = [function(callback) {
        // create our model and attach a file
        model.name = 'hello'
        model.attach('files', {
          path: file
        }, callback)
      }, function(callback) {
        // file urls should have been populated
        model.files[0].url.should.be.ok

        // save the model
        model.save(callback)
      }, function(callback) {
        // load a new copy of the model
        model.id.should.be.ok

        StubSchema.findOne({
          _id: model.id
        }).select('name')
          .exec(function(error, doc) {
            doc.save(callback)
          })
      }]

      async.series(tasks, function(error) {
        should(error).not.ok

        // should have saved two attachments
        storage.save.callCount.should.equal(1)

        // and also removed one of them
        storage.remove.callCount.should.equal(0)

        done()
      })
    })
  })
})
