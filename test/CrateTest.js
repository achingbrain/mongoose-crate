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
})
