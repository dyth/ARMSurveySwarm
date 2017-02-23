var processor = require('../processing');
var route = require('../route');
var expect = require('chai').expect;

describe('Create tiles list', function() {
	it('Should setup a new list of tiles of size 10, 10', function() {
		processor.setGridDimensions({x:10, y:10});
		processor.createTilesList();
		expect(10).to.equal(processor.processingTiles[0].length);
		expect(10).to.equal(processor.processingTiles.length);
	});
});

describe('Round given position to correspond to tile index', function() {
	processor.setTileSize(10);
	it('Given input 10.12, position should be rounded down to 1 if tile size is 10', function() {
		expect(1).to.equal(processor.roundPosition(10.12));
	});
	it('Given input 45.31, position should be rounded down to 4 if tile size is 10', function() {
		expect(4).to.equal(processor.roundPosition(45.31));
	});
	it('Given input -2.34, position should be rounded to 0', function() {
		expect(0).to.equal(processor.roundPosition(-2.34));
	});
	it('Given input 123, position should be rounded to 10 since this is beyond the board.', function() {
		expect(10).to.equal(processor.roundPosition(123));
	});
});

describe('Set Tile light intensity given x and y positions', function() {
	it('Given positions 10.12, 45.31, round to x=1, y=4 and set tile to white=1', function() {
		//processor.startProcessing();
		processor.startProcessing = true;
		route.setUp(processor.width);
		processor.setTiles(0, [{x: 10.12, y: 45.31, lightIntensity: 1},
													 {x: 0, y:0, lightIntesity:0},
												   {x: 32.12, y: 76.23, lightIntensity: 1}]);
		expect(1).to.equal(processor.processingTiles[1][3][0]);
		expect(0).to.equal(processor.processingTiles[0][0][0]);
		expect(1).to.equal(processor.processingTiles[3][7][0]);
	});
});
