var Storage;

function Storage () { }
Storage.prototype.save = function (attachment, callback) {
  callback(undefined, attachment.target);
}
Storage.prototype.remove = function (attachment, callback) { }

module.exports = Storage;
