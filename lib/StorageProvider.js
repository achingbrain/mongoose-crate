'use strict'

class StorageProvider {

  save (path, callback) {
    throw new Error('StorageProvider#save not implemented')
  }

  remove (attachment, callback) {
    throw new Error('StorageProvider#remove not implemented')
  }
}

module.exports = StorageProvider
