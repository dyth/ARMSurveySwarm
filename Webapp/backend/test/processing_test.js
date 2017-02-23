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

describe('Round given position to correspond to tile index', function() {
	it('Given input 34.43, position should be rounded down to 3 if tile size is 10', function() {
		processor.setTileSize(10);
		expect(3).to.equal(processor.roundPosition(34.43));
	});
	it('Given input -2.34, position should be rounded to 0', function() {
		expect(0).to.equal(processor.roundPosition(-2.34));
	});
	it('Given input 123, position should be rounded to 10 since this is beyond the board.', function() {
		expect(10).to.equal(processor.roundPosition(123));
	});
});
