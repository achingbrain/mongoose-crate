var mongoose = require('mongoose'),
  crate = require('../../index'),
  sinon = require('sinon'),
  randomString = require('./randomString')

module.exports = function(processor, callback) {
  var storage = {
    save: sinon.stub(),
    remove: sinon.stub()
  }

  // happy path
  storage.save.callsArgWith(1, undefined, randomString(10))
  storage.remove.callsArg(1)

  var StubSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    }
  })

  StubSchema.plugin(crate, {
    storage: storage,
    fields: {
      file: {
        processor: processor
      }
    }
  })

  var model = mongoose.model(randomString(10), StubSchema)

  callback(model, storage)
}

