var processor = require('../processing');
var coms = require('../communication');
var route = require('../route');
var expect = require('chai').expect;

/* black is 0, white is 1 */
var getColour = function(intensity) {
	if (intensity < 400) {
		return 1;
	} else if (intensity > 600) {
		return 0;
	} else {
		return 2;
	}
}

describe('Create tiles list', function() {
	it('Should setup a new list of tiles of size 10, 10', function() {
		processor.setGridDimensions(10);
		expect(10).to.equal(processor.tiles[0].length);
		expect(10).to.equal(processor.tiles.length);
	});
});

describe('handleDone function', function() {
	it('should interpolate the points given', function() {
		processor.resetTiles();
		processor.setGridDimensions(10);
		processor.unconnectAllRobots();
		processor.addRobotToList(1);
		processor.robots[1] = {robotStatus: 1, corner: 0,
			 xDest: 6, yDest: 6};

		var values = [200, 750, 13, 1110, 173, 1000];
		processor.handleDone(1, values);
		
		// NOTE handleDone no longer gets corner tile
		for (var i = 1; i <= values.length; i ++) {
			var tile = processor.tiles[i][i];
			expect(tile.accepted).to.equal(getColour(values[i-1]));
		}
	});

	it('should interpolate some other points too', function() {
		processor.resetTiles();
		processor.initTiles();
		processor.setGridDimensions(10);

		processor.robots[1] = {robotStatus: 1, corner: 2, xDest : 8, yDest: 8};

		var values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
		processor.handleDone(1, values);
		var tile = processor.tiles[8][8];

		expect(tile).to.have.property("accepted", 1);
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

describe('next move', function() {
	it('should route robot to tile within quadrant for the corner the robot is ' +
	' at', function() {
		processor.setConnectedRobots();
		processor.unconnectAllRobots();
		processor.setGridDimensions(10);
		processor.setTileSize(10);

		processor.addRobotToList(0);
		route.setUp(10);

		var robot = processor.robots[0];

		for (var i = 0; i < 8; i++) {
			console.log('-----------');

			processor.nextMove(0);

			// xDest and yDest should be updated and should be within quadrant i

			expect(route.getQuadrant(robot.xDest, robot.yDest)).
				to.equal(i%4);

			// Update the robot start position
			robot.corner = (robot.corner + 1) % 4
		}

	});
	it('should stop all robots when all quadrants have no tiles to check', function() {
		route.uncheckedTiles[0].length = 0;
		route.uncheckedTiles[1].length = 0;
		route.uncheckedTiles[2].length = 0;
		route.uncheckedTiles[3].length = 0;
		processor.nextMove(0);
	});
});


describe('tile update', function() {
	it('updates accepted tile to either 1 (white) or 0 (black)', function() {
		processor.setGridDimensions(10);
		processor.addRobotToList(0);
		processor.updateTile(0,0);
		expect(processor.tiles[0][0].accepted).to.equal(2);
	});
});
