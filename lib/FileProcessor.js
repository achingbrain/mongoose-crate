var fs = require("fs"),
	async = require("async"),
	path = require("path");

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
		model.url = url;
		model.name = attachment.originalFilename ? attachment.originalFilename : path.basename(attachment.path);

		callback(error);
	});
};

FileProcessor.prototype.remove = function(model, field, storageProvider) {
	//storageProvider.remove(model[field]);
};

module.exports = FileProcessor;
