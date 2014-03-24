var util = require("util"),
	StorageProvider = require("../../lib/StorageProvider");

var StubStorageProvider = function() {
	StorageProvider.call(this);
}
util.inherits(StubStorageProvider, StorageProvider);

module.exports = StubStorageProvider;