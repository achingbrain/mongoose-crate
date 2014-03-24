var StorageProvider = function() {

};

StorageProvider.prototype.createOrUpdate = function(path, stats, storageProvider, model, callback) {
	throw new Error("StorageProvider#createOrUpdate not implemented");
};

StorageProvider.prototype.remove = function(attachment, callback) {
	throw new Error("StorageProvider#remove not implemented");
};

module.exports = StorageProvider;
