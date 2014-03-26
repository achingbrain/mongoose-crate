var os = require("os"),
	fs = require("fs"),
	async = require("async"),
	mmm = require("mmmagic"),
	Magic = mmm.Magic,
	check = require("check-types"),
	StorageProvider = require("./StorageProvider"),
	FileProcessor = require("./FileProcessor");

var Crate = function() {
	this._magic = new Magic(mmm.MAGIC_MIME_TYPE);
}

Crate.prototype._addFields = function(schema, options) {
	var addOperation = {};

	Object.keys(options.fields).forEach(function(field) {
		addOperation[field] = options.fields[field].processor.createFieldSchema();

		if(options.fields[field].array) {
			addOperation[field] = [addOperation[field]];
		}
	});

	schema.add(addOperation);
}

Crate.prototype._validateOptions = function(options) {
	check.verify.object(options, "No options were specified!");
	check.verify.object(options.fields, "No fields were specified!");

	if(!options.tempDir) {
		options.tempDir = os.tmpdir();
	}

	Object.keys(options.fields).forEach(function(field) {
		if(!options.fields[field].processor) {
			options.fields[field].processor = new FileProcessor();
		}

		check.verify.fn(options.fields[field].processor.createFieldSchema, "FileProcessor object should implement the createFieldSchema method!");
		check.verify.fn(options.fields[field].processor.process, "FileProcessor object should implement the process method!");
		check.verify.fn(options.fields[field].processor.remove, "FileProcessor object should implement the remove method!");
	});
}

Crate.prototype._validateProvider = function(options) {
	check.verify.object(options.storage, "Please pass a StorageProvider!");
	check.verify.fn(options.storage.save, "Storage object should implement the save method!");
	check.verify.fn(options.storage.remove, "Storage object should implement the remove method!");
}

Crate.prototype.plugin = function(schema, options) {
	this._validateOptions(options);
	this._validateProvider(options);
	this._addFields(schema, options);

	var self = this;

	schema.methods.attach = function(field, attachment, callback) {
		if(!options.fields[field]) {
			return callback(new Error("Field '" + field + "' was not registered as an attachment property"));
		}

		if(!attachment || !attachment.path) {
			return callback(new Error("Attachment has no path property!"));
		}

		var model = this;

		if(options.fields[field].array) {
			var modelArray = this[field];
			model = this[field].create();
		}

		var tasks = [function(callback) {
			fs.exists(attachment.path, function(result) {
				callback(!result ? new Error("No file exists at " + attachment.path) : undefined);
			});
		}];

		if(!attachment.mimeType) {
			tasks.push(function(callback) {
				self._magic.detectFile(attachment.path, function(error, mimeType) {
					attachment.mimeType = mimeType;
					callback(error);
				});
			}.bind(this));
		}

		tasks.push(function(callback) {
			options.fields[field].processor.process(attachment, options.storage, model, callback);
		});

		async.series(tasks, function(error) {
			if(error) {
				return callback(error);
			}

			if(options.fields[field].array) {
				modelArray.push(model);
			}

			callback();
		});
	};

	// register a hook to clean up files before models are deleted
	schema.pre("remove", function (next) {
		var model = this;
		var tasks = [];

		Object.keys(options.fields).forEach(function(field) {
			if(options.fields[field].array) {
				model[field].forEach(function(arrayField) {
					tasks.push(function(callback) {
						options.fields[field].processor.remove(options.storage, arrayField, callback);
					})
				});
			} else {
				tasks.push(function(callback) {
					options.fields[field].processor.remove(options.storage, model[field], callback);
				})
			}
		});

		async.parallel(tasks, function(error) {
			if(error) {
				throw error;
			}

			next();
		});
	})
}

module.exports = Crate;
