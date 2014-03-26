var fs = require("fs"),
	async = require("async"),
	path = require("path");

var FileProcessor = function() {

};

FileProcessor.prototype.createFieldSchema = function() {
	return {
		size: Number,
		name: String,
		mimeType: String,
		url: String
	};
};

FileProcessor.prototype.process = function(attachment, storageProvider, model, callback) {
	async.waterfall([function(callback) {
		fs.stat(attachment.path, function(error, stats) {
			callback(error, stats);
		});
	}, function(stats, callback) {
		storageProvider.save(attachment.path, function(error, url) {
			callback(error, stats, url);
		});
	}], function(error, stats, url) {
		model.size = stats.size;
		model.name = attachment.originalFilename ? attachment.originalFilename : path.basename(attachment.path);
		model.mimeType = attachment.mimeType;
		model.url = url;

		callback(error);
	});
};

FileProcessor.prototype.remove = function(storageProvider, model, callback) {
	storageProvider.remove(model, callback);
};

module.exports = FileProcessor;
