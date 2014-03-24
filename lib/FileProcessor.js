
var FileProcessor = function() {

};

FileProcessor.prototype.createFieldSchema = function() {
	return {
		size: Number,
		name: String,
		modified: Date,
		created: Date,
		url: String
	};
};

FileProcessor.prototype.process = function(path, stats, storageProvider, model, callback) {
	storageProvider.createOrUpdate(path, function(error, url) {
		if(error) {
			return callback(error);
		}

		model.url = url;

		callback();
	});
};

FileProcessor.prototype.remove = function(model, field, storageProvider) {
	storageProvider.remove(model[field]);
};

module.exports = FileProcessor;
