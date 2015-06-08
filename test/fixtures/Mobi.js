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
  var fileName = path.join(os.tmpdir(), randomString(10) + '.mobi')
  fs.writeFile(fileName, this.content, function (err) {
    if (err) return callback(err)
    this.attach('hardCopy', { path: fileName }, callback)
  }.bind(this))
})

mobiSchema.plugin(crate, {
  storage: new Storage(),
  fields: { hardCopy: { } }
})

module.exports = mongoose.model('Mobi', mobiSchema)
