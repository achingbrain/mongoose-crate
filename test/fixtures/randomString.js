'use strict'

const crypto = require('crypto')

module.exports = (length) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}
