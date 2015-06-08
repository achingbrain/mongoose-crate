var mongoose = require('mongoose'),
    crate = require('../../index'),
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    randomString = require('./randomString'),
    Storage = require('./Storage')

var mobiSchema = new mongoose.Schema({
  content: { type: String, require: true },
  updated_at: { type: Date, default: function () { return new Date() } }
})

mobiSchema.pre('save', function(callback){
  var fileName = path.join(os.tmpdir(), randomString(10) + '.epub')
  fs.writeFile(fileName, this.content, function (err) {
    this.attach('hardCopy', { path: fileName }, callback)
  }.bind(this))
})

mobiSchema.pre('save', function(callback){
  var fileName = path.join(os.tmpdir(), randomString(10) + '.epub')
  fs.writeFile(fileName, this.content, function (err) {
    this.attach('harderCopy', { path: fileName }, callback)
  }.bind(this))
})

mobiSchema.plugin(crate, {
  url: 'artifacts/:modelName/:id-:updated_at',
  storage: new Storage(),
  fields: {
    hardCopy: { },
    harderCopy: {
      url: 'deepArtifacts/:modelName/:fieldName/:id-:updated_at'
    },
  }
})

module.exports = mongoose.model('Epub', mobiSchema)
