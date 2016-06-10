const should = require('should')
const sinon = require('sinon')
const StorageProvider = require('../lib/StorageProvider')

describe('StorageProvider', function() {

  it('should throw on unimplemented save method', function () {
    var storageProvider = new StorageProvider()

    should.throws(() => {
      storageProvider.save()
    })
  })

  it('should throw on unimplemented remove method', function () {
    var storageProvider = new StorageProvider()

    should.throws(() => {
      storageProvider.remove()
    })
  })
})
