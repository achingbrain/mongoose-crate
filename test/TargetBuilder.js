var should = require('should'),
    mongoose = require('mongoose'),
    randomString = require('./fixtures/randomString'),
    targetBuilder = require('../lib/TargetBuilder')

describe('Crate', function () {
  var Person, person, personSchema
    , attachement

  before(function (){
    attachment = {
      path: '/path/to/my/attchment.pdf',
      type: 'application/pdf',
      name: 'attachment.pdf',
      size: 120874
    }

    personSchema = new mongoose.Schema({
      type: String,
      salt: {
        default: function () { return randomString(16) },
        type: String,
      },
      tags: {
        type: Array,
      },
      firstName: String,
      lastName: String,
      updated_at: {
        default: function () { return new Date() },
        type: Date
      }
    })

    personSchema.virtual('fullName').get(function (){
      return [
        this.firstName,
        this.lastName
      ].map(function (v) {
        return v.toLowerCase()
      }).join('-')
    })

    personSchema.methods.profileStatus = function (){
      return 'complete'
    }
    Person = mongoose.model('Person', personSchema)
    person = new Person({
      firstName: 'Jerry',
      lastName: 'Biggles',
      type: 'ball',
      tags: [ 'employee', 'manager' ]
    })
  })

  context('validation', function (){
    it('requires a model', function () {
      (function () {
        targetBuilder(undefined, 'field', attachment, 'format')
      }).should.throw('model is required')
    })

    it('requires a field', function () {
      (function () {
        targetBuilder(person, undefined, attachment, 'format')
      }).should.throw('field is required')
    })

    it('requires an attachment', function () {
      (function () {
        targetBuilder(person, 'field', undefined, 'format')
      }).should.throw('attachment is required')
    })

    it('requires a format', function () {
      (function () {
        targetBuilder(person, 'field', attachment)
      }).should.throw('format is required')
    })

    it('throws an error if the key is undefined', function () {
      (function () {
        targetBuilder(person, 'image', attachment, ':not_real')
      }).should.throw(':not_real does not resolve to a value')
    })

    it('throws an error if they key evaluates to an Array', function () {
      (function () {
        targetBuilder(person, 'image', attachment, ':tags')
      }).should.throw(':tags returned unsupported type Array')
    })
  })

  context('defaults', function (){
    it('uses the attachment fileExt', function () {
      targetBuilder(person, 'image', attachment, 'file').should.eql(
        'file.pdf'
      )
    })

    it('ignores non-keywrods', function () {
      targetBuilder(person, 'image', attachment, '/my/path/for/:type').should.eql(
        '/my/path/for/ball.pdf'
      )
    })
  })

  context('build from model paths', function (){
    it('will replace single paths', function () {
      targetBuilder(person, 'image', attachment, ':type').should.eql(
        'ball.pdf'
      )
    })

    it('will replace multiple paths', function () {
      targetBuilder(person, 'image', attachment, ':type/:type').should.eql(
        'ball/ball.pdf'
      )
    })

    it('will replace many different paths', function () {
      targetBuilder(person, 'image', attachment, ':type/:_id/:salt').should.eql(
        [ 'ball', person._id, person.salt ].join('/') + '.pdf'
      )
    })
  })

  context('virtuals', function (){
    it('builds from virtuals', function () {
      targetBuilder(person, 'image', attachment, ':type/:fullName').should.eql(
        'ball/jerry-biggles.pdf'
      )
    })
  })

  context('functions', function (){
    it('builds from functions', function () {
      targetBuilder(person, 'image', attachment, ':type/:profileStatus').should.eql(
        'ball/complete.pdf'
      )
    })
  })

  context('formatting types', function (){
    it('formates dates as getTime', function () {
      targetBuilder(person, 'image', attachment, ':id/:updated_at').should.eql(
        [ person.id, person.updated_at.getTime() ].join('/') + '.pdf'
      )
    })
  })

  context('special keys', function (){
    context('model', function () {
      it('uses the modelName of the instance', function () {
        targetBuilder(person, 'image', attachment, ':modelName/:id').should.eql(
          [ 'Person', person.id ].join('/') + '.pdf'
        )
      })

      it('uses the collectionName of the instance', function () {
        targetBuilder(person, 'image', attachment, ':collectionName/:id').should.eql(
          [ 'people', person.id ].join('/') + '.pdf'
        )
      })
    })

    context('field', function () {
      it('used the field name', function () {
        targetBuilder(person, 'image', attachment, ':collectionName/:fieldName/:id').should.eql(
          [ 'people', 'image', person.id ].join('/') + '.pdf'
        )
      })
    })

    context('attachment', function () {
      it('can use the attachment name', function () {
        targetBuilder(person, 'image', attachment, ':collectionName/:fieldName/:id-:attachmentName').should.eql(
          [ 'people', 'image', [ person.id, 'attachment' ].join('-') ].join('/') + '.pdf'
        )
      })

      it('can use the attachment size', function () {
        targetBuilder(person, 'image', attachment, ':collectionName/:fieldName/:id-:attachmentName-:attachmentSize').should.eql(
          [ 'people', 'image', [ person.id, 'attachment', attachment.size ].join('-') ].join('/') + '.pdf'
        )
      })
    })
  })
})
