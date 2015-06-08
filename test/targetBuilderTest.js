var should = require('should'),
    mongoose = require('mongoose'),
    Person = require('./fixtures/Person'),
    targetBuilder = require('../lib/TargetBuilder')

describe('Crate', function () {
  var person
    , attachment = {
        path: '/path/to/my/attchment.pdf',
        type: 'application/pdf',
        name: 'attachment.pdf',
        size: 120874
      }

  before(function (){
    person = new Person({
      firstName: 'Jerry',
      lastName: 'Biggles',
      type: 'ball',
      tags: [ 'employee', 'manager' ],
      meta: {
        phone: '1-333-333-4444'
      }
    })
  })

  context('validation', function (){
    it('requires a model', function (done) {
      targetBuilder(undefined, 'field', attachment, 'format', function (error, target){
        should(error).exist
        error.message.should.eql('model is required')
        done()
      })
    })

    it('requires a field', function (done) {
      targetBuilder(person, undefined, attachment, 'format', function (error, target) {
        should(error).exist
        error.message.should.eql('field is required')
        done()
      })
    })

    it('requires an attachment', function (done) {
      targetBuilder(person, 'field', undefined, 'format', function (error, target) {
        should(error).exist
        error.message.should.eql('attachment is required')
        done()
      })
    })

    it('requires a format', function (done) {
      targetBuilder(person, 'field', attachment, undefined, function (error, target) {
        should(error).exist
        error.message.should.eql('format is required')
        done()
      })
    })
  })

  context('invalid values for keys', function (){
    describe('when the resolved value is falsey', function () {
      it('throws an error', function (done) {
        targetBuilder(person, 'image', attachment, ':not_real', function (error, target) {
          should(error).exist
          error.message.should.eql(':not_real resolved to a falsey value')
          done()
        })
      })
    })

    describe('when the resolved value is an Array', function () {
      it('throws an error', function (done) {
        targetBuilder(person, 'image', attachment, ':tags', function (error, target) {
          should(error).exist
          error.message.should.eql(':tags returned unsupported type Array')
          done()
        })
      })
    })

    describe('when the resolved value is an Object', function () {
      it('throws an error', function (done) {
        targetBuilder(person, 'image', attachment, ':meta', function (error, target) {
          should(error).exist
          error.message.should.eql(':meta returned unsupported type Object')
          done()
        })
      })
    })

    describe('when the resolved value is a function that returns a falsey value', function () {
      it('throws an error', function (done) {
        targetBuilder(person, 'image', attachment, ':age', function (error, target) {
          should(error).exist
          error.message.should.eql(':age resolved to a falsey value')
          done()
        })
      })
    })
  })

  context('defaults', function (){
    it('uses the attachment fileExt', function (done) {
      targetBuilder(person, 'image', attachment, 'file', function (error, target) {
        should(error).not.exist
        target.should.eql('file.pdf')
        done()
      })
    })

    it('ignores non-keywrods', function (done) {
      targetBuilder(person, 'image', attachment, '/my/path/for/:type', function (error, target) {
        should(error).not.exist
        target.should.eql('/my/path/for/ball.pdf')
        done()
      })
    })
  })

  context('build from model paths', function (){
    it('will replace single paths', function (done) {
      targetBuilder(person, 'image', attachment, ':type', function (error, target) {
        should(error).not.exist
        target.should.eql('ball.pdf')
        done()
      })
    })

    it('will replace multiple paths', function (done) {
      targetBuilder(person, 'image', attachment, ':type/:type', function (error, target) {
        should(error).not.exist
        target.should.eql('ball/ball.pdf')
        done()
      })
    })

    it('will replace many different paths', function (done) {
      targetBuilder(person, 'image', attachment, ':type/:_id/:salt', function(error, target){
        should(error).not.exist
        target.should.eql([ 'ball', person._id, person.salt ].join('/') + '.pdf')
        done()
      })
    })
  })

  context('virtuals', function (){
    it('builds from virtuals', function (done) {
      targetBuilder(person, 'image', attachment, ':type/:fullName', function (error, target) {
        should(error).not.exist
        target.should.eql('ball/jerry-biggles.pdf')
        done()
      })
    })
  })

  context('functions', function (){
    it('builds from functions', function (done) {
      targetBuilder(person, 'image', attachment, ':type/:profileStatus', function (error, target) {
        should(error).not.exist
        target.should.eql('ball/complete.pdf')
        done()
      })
    })
  })

  context('formatting types', function (){
    it('formats dates as getTime', function (done) {
      targetBuilder(person, 'image', attachment, ':id/:updated_at', function (error, target) {
        should(error).not.exist
        target.should.eql([ person.id, person.updated_at.getTime() ].join('/') + '.pdf')
        done()
      })
    })
  })

  context('special keys', function (){
    context('model', function () {
      it('uses the modelName of the instance', function (done) {
        targetBuilder(person, 'image', attachment, ':modelName/:id', function (error, target) {
          should(error).not.exist
          target.should.eql([ 'Person', person.id ].join('/') + '.pdf')
          done()
        })
      })

      it('uses the collectionName of the instance', function (done) {
        targetBuilder(person, 'image', attachment, ':collectionName/:id', function (error, target) {
          should(error).not.exist
          target.should.eql([ 'people', person.id ].join('/') + '.pdf')
          done()
        })
      })
    })

    context('field', function () {
      it('used the field name', function (done) {
        targetBuilder(person, 'image', attachment, ':collectionName/:fieldName/:id', function (error, target) {
          should(error).not.exist
          target.should.eql([ 'people', 'image', person.id ].join('/') + '.pdf')
          done()
        })
      })
    })

    context('attachment', function () {
      it('can use the attachment name', function (done) {
        targetBuilder(person, 'image', attachment, ':collectionName/:fieldName/:id-:attachmentName', function (error, target) {
          should(error).not.exist
          target.should.eql([ 'people', 'image', [ person.id, 'attachment' ].join('-') ].join('/') + '.pdf')
          done()
        })
      })

      it('can use the attachment size', function (done) {
        targetBuilder(person, 'image', attachment, ':collectionName/:fieldName/:id-:attachmentName-:attachmentSize', function (error, target) {
          should(error).not.exist
          target.should.eql([ 'people', 'image', [ person.id, 'attachment', attachment.size ].join('-') ].join('/') + '.pdf')
          done()
        })
      })
    })
  })
})
