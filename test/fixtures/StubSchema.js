var mongoose = require("mongoose"),
	crate = require("../../index"),
	StorageProvider = require("./StubStorageProvider");

var StubSchema = new mongoose.Schema({
	name: {
		type: String,
			required: true
	}
});

StubSchema.plugin(crate, {
	storage: new StorageProvider(),
	fields: {
		file: {}
	}
});

module.exports = mongoose.model("StubSchema", StubSchema);
