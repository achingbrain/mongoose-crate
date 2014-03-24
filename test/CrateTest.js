var should = require("should"),
	Crate = require("../lib/Crate"),
	StubStorageProvider = require("./fixtures/StubStorageProvider");

describe("Crate", function() {

	it("should register and retrieve a StorageProvider", function(done) {
		var providerName = "foo";
		var provider = new StubStorageProvider();

		var crate = new Crate();
		crate.registerStorageProvider(providerName, provider);
		crate.findStorageProvider(providerName).should.equal(provider);

		done();
	})

	it("should object strenuously to non-existent StorageProvider", function(done) {
		var crate = new Crate();
		crate.findStorageProvider.bind(crate, "foo").should.throw();

		done();
	})
})
