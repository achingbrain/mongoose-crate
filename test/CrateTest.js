var should = require("should"),
	path = require("path"),
	sinon = require("sinon"),
	Crate = require("../lib/Crate"),
	createSchema = require("./fixtures/StubSchema"),
	createSchemaWithArrayProperty = require("./fixtures/StubSchemaWithArrayProperty");

describe("Crate", function() {

	it("should attach a file", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		createSchema(function(StubSchema) {
			var model = new StubSchema();
			model.attach("file", {
				path: file
			}, function (error) {
				should(error).not.ok;

				done();
			});
		});
	})

	it("should attach a file to an array", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		createSchemaWithArrayProperty(function(StubSchema) {
			var model = new StubSchema();

			model.files.length.should.equal(0);
			model.attach("files", {
				path: file
			}, function (error) {
				should(error).not.ok;

				model.files.length.should.equal(1);

				done();
			});
		});
	})

	it("should error on non attachment field", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		createSchema(function(StubSchema) {
			var model = new StubSchema();
			model.attach("foo", {
				path: file
			}, function (error) {
				error.should.be.ok;

				done();
			});
		});
	})

	it("should error when attachment path is missing", function(done) {
		createSchema(function(StubSchema) {
			var model = new StubSchema();
			model.attach("file", {}, function (error) {
				error.should.be.ok;

				done();
			});
		});
	})

	it("should error on non-existent file", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/foo.png");

		createSchema(function(StubSchema) {
			var model = new StubSchema();
			model.attach("file", {
				path: file
			}, function(error) {
				error.should.be.ok;

				done();
			});
		});
	})

	it("should remove attachment when model is deleted", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		createSchema(function(StubSchema, storage) {
			var model = new StubSchema();
			model.attach("file", {
				path: file
			}, function(error) {
				should(error).not.ok;

				storage.remove.callCount.should.equal(0);

				model.remove();

				storage.remove.callCount.should.equal(1);

				done();
			});
		});
	});

	it("should remove attachment array when model is deleted", function(done) {
		var file = path.resolve(__dirname + "/./fixtures/node_js_logo.png");

		createSchemaWithArrayProperty(function(StubSchema, storage) {
			var model = new StubSchema();
			model.attach("files", {
				path: file
			}, function(error) {
				should(error).not.ok;

				model.attach("files", {
					path: file
				}, function(error) {
					should(error).not.ok;

					storage.remove.callCount.should.equal(0);

					model.remove();

					storage.remove.callCount.should.equal(2);

					done();
				});
			});
		});
	});
})
