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

describe('Set Tile with light intensity given x and y positions', function() {
	it('Round to tile indices and set tile to light Intensity', function() {
		processor.startProcessing();
		route.setUp(processor.width);
		processor.setTiles(0, [{x: 10.12, y: 45.31, lightIntensity: 1},
													 {x: 0, y: 0, lightIntensity: 0},
												   {x: 34.52, y: 78.23, lightIntensity: 1}]);
		expect(1).to.equal(processor.processingTiles[1][4][0]);
		expect(0).to.equal(processor.processingTiles[0][0][0]);
		expect(1).to.equal(processor.processingTiles[3][7][0]);
		console.log(processor.processingTiles[1][4]);
	});

	it('When two colours agree, set final tile - position 5', function() {
		processor.setTiles(1, [{x: 12.42, y:47.23, lightIntensity: 1}]);
		console.log(processor.processingTiles[1][4]);
		expect(1).to.equal(processor.processingTiles[1][4][1]);
		expect(1).to.equal(processor.processingTiles[1][4][5]);
	});

	it('When two colours don\'t agree, delegate to re-check tile', function() {
		processor.setTiles(2, [{x: 55.47, y:76.23, lightIntensity: 0}]);
		processor.setTiles(4, [{x: 51.75, y:72.56, lightIntensity: 1}]);
		expect(0).to.equal(processor.processingTiles[5][7][2]);
		expect(1).to.equal(processor.processingTiles[5][7][4]);

		//check that final colour has NOT been setTimeout
		expect(2).to.equal(processor.processingTiles[5][7][5]);
	});
});

describe('rotate Clockwise', function() {
	it('Given orientation to turn clockwise, next orientation is calculated' +
	' as being between 0 and 2PI', function() {
	processor.rotateClockwise(0, 3*Math.PI);
	expect(processor.robots[0].orientation).at.most(2*Math.PI);
	});
});

describe('Vector Length', function() {
	it('Given a vector [1,1], length returned should be 1', function() {
		expect(Math.sqrt(2)).to.equal(processor.vectorLength([1,1]));
	});
	it('Given a vector [3,4], length returned should be 5', function() {
		expect(5).to.equal(processor.vectorLength([3,4]));
	});
});

describe('Route robot', function() {
	it('Check that route does not set robots to recheck current tile', function() {
		processor.routeRobot(1);
		console.log('x '+ processor.robots[1].xPrev + processor.robots[1].xAfter +
	'y ' + processor.robots[1].yPrev + processor.robots[1].yAfter );
		if (processor.robots[1].xPrev == processor.robots[1].xAfter) {
			expect(processor.robots[1].yPrev).to.not.equal(processor.robots[1].yAfter);
		} else if (processor.robots[1].yPrev == processor.robots[1].yAfter) {
			expect(processor.robots[1].xPrev).to.not.equal(processor.robots[1].xAfter);
		}
	});
});
