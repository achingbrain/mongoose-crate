var should = require("should"),
	path = require("path"),
	Crate = require("../lib/Crate"),
	StubSchema = require("./fixtures/StubSchema"),
	StubSchemaWithArrayProperty = require("./fixtures/StubSchemaWithArrayProperty");

describe("Crate", function() {

	it("should attach a file", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		var model = new StubSchema();
		model.attach("file", {
			path: file
		}, function(error) {
			should(error).not.ok;

			done();
		});
	})

	it("should attach a file to an array", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");
		var model = new StubSchemaWithArrayProperty();

		model.files.length.should.equal(0);
		model.attach("files", {
			path: file
		}, function(error) {
			should(error).not.ok;

			model.files.length.should.equal(1);

			done();
		});
	})

	it("should error on non attachment field", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		var model = new StubSchema();
		model.attach("foo", {
			path: file
		}, function(error) {
			error.should.be.ok;

			done();
		});
	})

	it("should error when attachment path is missing", function(done) {
		var model = new StubSchema();
		model.attach("file", {}, function(error) {
			error.should.be.ok;

			done();
		});
	})

	it("should error on non-existent file", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/foo.png");

		var model = new StubSchema();
		model.attach("file", {
			path: file
		}, function(error) {
			error.should.be.ok;

			done();
		});
	})
})
