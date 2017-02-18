var processor = require('../processing');
var expect = require('chai').expect;

describe('Create tiles list', function() {
	it('should setup a new list of tiles of size 10, 10', function() {
		processor.setGridDimensions({x:10, y:10});
		processor.createTilesList();
		expect(10).to.equal(processor.processingTiles[0].length);
		expect(10).to.equal(processor.processingTiles.length);
	});
});

