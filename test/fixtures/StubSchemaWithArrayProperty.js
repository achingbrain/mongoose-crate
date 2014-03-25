var mongoose = require("mongoose"),
	crate = require("../../index"),
	StorageProvider = require("./StubStorageProvider");

var StubSchemaWithArrayProperty = new mongoose.Schema({
	name: {
		type: String,
		required: true
	}
});

StubSchemaWithArrayProperty.plugin(crate, {
	storage: new StorageProvider(),
	fields: {
		files: {
			array: true
		}
	}
});

module.exports = mongoose.model("StubSchemaWithArrayProperty", StubSchemaWithArrayProperty);
