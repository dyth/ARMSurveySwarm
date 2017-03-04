var processor = require('../processing');
var coms = require('../communication');
var route = require('../route');
var expect = require('chai').expect;

describe('Create tiles list', function() {
	it('Should setup a new list of tiles of size 10, 10', function() {
		processor.setGridDimensions({x:10, y:10});
		expect(10).to.equal(processor.processingTiles[0].length);
		expect(10).to.equal(processor.processingTiles.length);
	});
});

describe('setTiles function', function() {
	it('should interpolate the points given', function() {
		processor.resetProcessingTiles();
		processor.createTilesList();
		processor.robots[1] = {robotStatus: 1, quadrant: 0, 
			xCorner: 0, yCorner: 0, xAfter: 6, yAfter: 6};

		var values = [1, 0, 1, 0, 1, 0];
		processor.setTiles(1, values);
		for (var i = 0; i < values.length; i ++) {
			var tiles = processor.processingTiles[i][i];
			console.log(values[i] , tiles);
			expect(tiles.accepted).to.equal(values[i]);
		}
	});
});

describe('Vector Length', function() {
	processor.setTileSize(100); // tile size is in mm
	processor.setGridDimensions({x:10, y:10});
	it('Given a vector [1,1], length returned should be 1', function() {
		expect(100*Math.sqrt(2)).to.equal(processor.vectorLength([1,1]));
	});
	it('Given a vector [3,4], length returned should be 5', function() {
		expect(500).to.equal(processor.vectorLength([3,4]));
	});
});

describe('Reset robot', function() {
	it('should reset change the status of the robot after being called',
		function() {
			processor.addRobotToList(0);
			processor.robots[0].robotStatus = 100;
			processor.robotConnectionLost(0);
			expect(processor.robots[0].robotStatus).to.equal(2);
	});
});

// TODO -- write some tests for nextMove
describe('next Move', function() {
	it('routes robot to another tile', function() {

	});
});
