var processor = require('../processing');

var assert = require('assert');

describe('Create tiles list', function() {
	it('should print "test"', function() {
		processor.test();
	});
	it('should return a new list of tiles of size 10, 10', function() {
		processor.test(10, 10);
		processor.createTilesList(10, 10);
		assert.equal(10, processor.processingTiles.length);
	});
});

