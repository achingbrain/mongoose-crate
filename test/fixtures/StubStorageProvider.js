'use strict'

const StorageProvider = require('../../lib/StorageProvider')

class StubStorageProvider extends StorageProvider {
  save (path, callback) {
    callback(null, path)
  }

  remove (attachment, callback) {
    callback()
  }
}

module.exports = StubStorageProvider
