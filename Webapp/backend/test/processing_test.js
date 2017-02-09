var assert = require('assert');

describe('Create tiles list', function() {
	it('should return a new list of tiles of size 10, 10', function() {
		var tiles = createTilesList(10, 10);
		assert.equal(10, tiles.length);
		assert.equal(10, tiles[0].length);
	});
});
