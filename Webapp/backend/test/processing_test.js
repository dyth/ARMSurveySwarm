var processor = require('../processing');
var expect = require('chai').expect;

describe('Create tiles list', function() {
	it('should print "test"', function() {
		processor.test();
	});
	it('should return a new list of tiles of size 10, 10', function() {
		processor.test(10, 10);
		processor.createTilesList(10, 10);
		expect(10).to.equal(processor.processingTiles.length);
	});
});

