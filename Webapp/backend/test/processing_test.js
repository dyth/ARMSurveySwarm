var processor = require('../processing');
var coms = require('../communication');
var route = require('../route');
var expect = require('chai').expect;

describe('Create tiles list', function() {
	it('Should setup a new list of tiles of size 10, 10', function() {
		processor.setRobotStates(5);
		processor.setGridDimensions({x:10, y:10});
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
		processor.setRobotStates(5);
		processor.setGridDimensions({x: 10, y: 10});
		processor.startProcessing();
		processor.setTiles(0, [{x: 10.12, y: 45.31, lightIntensity: 1},
													 {x: 0, y: 0, lightIntensity: 0},
												   {x: 34.52, y: 78.23, lightIntensity: 1}]);
		expect(1).to.equal(processor.processingTiles[1][4][0]);
		expect(0).to.equal(processor.processingTiles[0][0][0]);
		expect(1).to.equal(processor.processingTiles[3][7][0]);
	});

	it('When two colours agree, set final tile', function() {
		processor.setTiles(1, [{x: 12.42, y:47.23, lightIntensity: 1},
													 {x: 5.4, y: 2.74, lightIntensity: 0}]);
		expect(1).to.equal(processor.processingTiles[1][4][1]);
		expect(0).to.equal(processor.processingTiles[0][0][1]);

		expect(1).to.equal(processor.processingTiles[1][4][5]);
		expect(0).to.equal(processor.processingTiles[0][0][5]);
	});

	it('When two colours don\'t agree, delegate to re-check tile', function() {
		processor.setTiles(2, [{x: 55.47, y:76.23, lightIntensity: 0}]);
		processor.setTiles(4, [{x: 51.75, y:72.56, lightIntensity: 1}]);
		expect(0).to.equal(processor.processingTiles[5][7][2]);
		expect(1).to.equal(processor.processingTiles[5][7][4]);

		//check that final colour has NOT been set
		expect(2).to.equal(processor.processingTiles[5][7][5]);
	});
});

describe('setTiles function', function() {
	it('should interpolate the points given', function() {

	});
});

describe('get new orientation - ', function() {
	it('given orientation to turn, next orientation is calculated' +
	' as being between 0 and 2PI', function() {
	processor.getNewOrientation(0, 3*Math.PI);
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

describe('Reset robot', function() {
	it('should reset the robot position after being called', function() {
		processor.robots[0].xPrev = -1000;
		processor.resetRobot(0);

		expect(processor.robots[0].xPrev).to.equal(0);
	});

	it('should reset change the status of the robot after being called',
		function() {
			processor.robots[0].robotStatus = 100;
			processor.robotConnectionLost(0);
			expect(processor.robots[0].robotStatus).to.equal(3);
	});
});

describe('Route robot', function() {
	it('Check that route does not set robots to recheck current tile', function() {
		processor.startProcessing();
		processor.routeRobot(1, 0);
		if (processor.robots[1].xPrev === processor.robots[1].xAfter) {
			expect(processor.robots[1].yPrev).to.not.equal(processor.robots[1].yAfter);
		} else if (processor.robots[1].yPrev === processor.robots[1].yAfter) {
			expect(processor.robots[1].xPrev).to.not.equal(processor.robots[1].xAfter);
		}
	});

	it('Should not route robot with unexpected index', function() {
		processor.routeRobot(6, 0);
	});
});

describe('check tile', function() {
	it('routes robot to another tile', function() {
		processor.startProcessing();
		processor.setRobotStates(2);
		processor.setGridDimensions({x:10, y:10});

		// /processor.checkTile(0, 2, 2);

	});
});

describe('If all tiles have been covered, send stopAll message', function() {
	it('Robot should receive stopAll message', function() {
		var currentlyCovered = processor.tilesCovered;
		processor.setRobotStates(2);
		processor.setGridDimensions({x:10, y:10});
		processor.startProcessing();

		var dataReceived;
		var dataReceived2;

		coms.receiveData("HELLO:1\n", {destroyed: false, write:
			function(data) {
				dataReceived = data;
			}
		});
		coms.receiveData("HELLO:2\n", {destroyed: false, write:
			function(data) {
				dataReceived2 = data;
			}
		});

		processor.setCoveredToTotalTiles();
		processor.tilesCovered = currentlyCovered;

		processor.setTiles(1, [{x:5, y:5, lightIntensity:1}]);

		expect(dataReceived).to.equal('STOP\n');
		expect(dataReceived2).to.equal('STOP\n');

	});
});
