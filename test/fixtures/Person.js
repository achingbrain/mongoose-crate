var mongoose = require('mongoose')
  , randomString = require('./randomString')

var personSchema = new mongoose.Schema({
  type: String,
  salt: {
    default: function () { return randomString(16) },
    type: String,
  },
  tags: {
    type: Array,
  },
  meta: {
    type: Object,
  },
  firstName: String,
  lastName: String,
  updated_at: {
    default: function () { return new Date() },
    type: Date
  }
})

personSchema.virtual('fullName').get(function (){
  return [ this.firstName, this.lastName ].map(function (v) { return v.toLowerCase() }).join('-')
})

personSchema.methods.profileStatus = function (){
  return 'complete'
}

personSchema.methods.age = function (){ }

module.exports = mongoose.model('Person', personSchema)
