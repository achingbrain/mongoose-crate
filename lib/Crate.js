var os = require("os"),
	fs = require("fs"),
	async = require("async"),
	StorageProvider = require("./StorageProvider"),
	FileProcessor = require("./FileProcessor");

var Crate = function() {

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
	if(!options) {
		throw new Error("No options were specified!");
	}

	if(!options.tempDir) {
		options.tempDir = os.tmpdir();
	}

	if(!options.storage) {
		throw new Error("No storage options were specified!");
	}

	if(!options.storage.provider) {
		throw new Error("No storage provider was specified!");
	}

	if(!options.fields) {
		throw new Error("No fields were specified!");
	}

	Object.keys(options.fields).forEach(function(field) {
		if(!options.fields[field].processor) {
			options.fields[field].processor = new FileProcessor();
		}

		if(!(options.fields[field].processor instanceof FileProcessor)) {
			throw new Error("options.fields['" + field + "'].processor should be an instance of FileProcessor");
		}
	});
}

Crate.prototype._validateProvider = function(options) {
	if(!(options.storage instanceof StorageProvider)) {
		throw new Error("Storage provider " + options.storage + " was not an instance of StorageProvider");
	}
}

Crate.prototype.plugin = function(schema, options) {
	this._validateOptions(options);
	this._validateProvider(options);
	this._addFields(schema, options);

	schema.methods.attach = function(field, path, callback) {
		if(!options.fields[field]) {
			return callback(new Error("Field '" + field + "' was not registered as an attachment property"));
		}

		var model = this;

		if(options.fields[field].array) {
			model = this[field].create();
		}

		var tasks = [
			function(callback) {
				fs.exists(path, function (exists) {
					callback(exists ? null : new Error("No file exists at " + path));
				});
			},
			function(callback) {
				fs.stat(path, callback);
			},
			function(stats, callback) {
				options.fields[field].processor.process(path, stats, options.storage, model, callback);
			}
		];

		async.waterfall(tasks, callback);
	};

	// register a hook to clean up files before models are deleted
	schema.pre("remove", function (next) {
		Object.keys(options.fields).forEach(function(field) {
			options.fields[field].processor.remove(options.storage);
		});

		next();
	})
}

module.exports = Crate;
