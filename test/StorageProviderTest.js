const should = require('should')
const StorageProvider = require('../lib/StorageProvider')

describe('StorageProvider', () => {
  it('should throw on unimplemented save method', () => {
    var storageProvider = new StorageProvider()

    should.throws(() => {
      storageProvider.save()
    })
  })

  it('should throw on unimplemented remove method', () => {
    var storageProvider = new StorageProvider()

    should.throws(() => {
      storageProvider.remove()
    })
  })
})
