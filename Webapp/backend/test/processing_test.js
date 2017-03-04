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

describe('next move', function() {
	it('should route robot to tile within quadrant for the corner the robot is ' +
	' at', function() {
		processor.setConnectedRobots();
		processor.addRobotToList(0);
		route.setUp(10);
		processor.nextMove(0);
		var robot = processor.robots[0];

		// xAfter and yAfter should be updated and should be within quadrant 0
		console.log('x '+ robot.xAfter + ' y ' + robot.yAfter);
		expect(route.getQuadrant(robot.xAfter, robot.yAfter)).
			to.equal(0);

	});
	it('should stop all robots when all quadrants have no tiles to check', function() {
		route.uncheckedTiles[0].length = 0;
		route.uncheckedTiles[1].length = 0;
		route.uncheckedTiles[2].length = 0;
		route.uncheckedTiles[3].length = 0;
		processor.nextMove(0);
	});
});

describe('stop all', function() {
	it('should send out a message to stop all the robots', function() {
		processor.setGridDimensions({x:10, y:10});
		processor.setConnectedRobots();
		processor.addRobotToList(0);
		processor.addRobotToList(1);
		console.log(processor.robots);
		var dataReceived;
		var dataReceived2;

		coms.receiveData({type: "HELLO", id: 0}, {destroyed:false, write: function(data) {
			dataReceived = data;
		}});
		coms.receiveData({type: "HELLO", id: 1}, {destroyed:false, write: function(data) {
			dataReceived2 = data;
		}});
		processor.stopAll();

		var json = JSON.parse(dataReceived);
		expect(json).to.have.property("type", "STOP");
		json = JSON.parse(dataReceived2);
		expect(json).to.have.property("type", "STOP");

	});
});

describe('tile update', function() {
	it('updates accepted tile to either 1 (white) or 0 (black)', function() {
		processor.setGridDimensions({x:10, y:10});
		processor.addRobotToList(0);
		processor.tileUpdate(0,0);
		expect(processor.processingTiles[0][0].accepted).to.equal(1);
	});
});

describe('convert', function() {
	it('takes destination provided by route, converting directions to tile to' +
		' polar coordinates from corner', function() {
			processor.setGridDimensions({x:10, y:10});
			processor.addRobotToList(0); //starts in quadrant 0
			processor.addRobotToList(1);
			processor.robots[1].quadrant = 1;

			var vectorLength = processor.vectorLength([4,4]);
			var vectorLength2 = processor.vectorLength([3,5]);

			var converted = processor.convert(0,4,4);
			var converted2 = processor.convert(1,3,5);
			console.log(converted2.angle);

			expect(converted.angle).to.equal(Math.PI/4);
			expect(converted.distance).to.equal(vectorLength);
			expect(converted2.angle).to.equal(Math.atan(5/3));
			expect(converted2.distance).to.equal(vectorLength2);
		});
});

describe('get next corner', function() {
	it('should return the coordinates and orientation of robot starting' +
		 ' at given corner', function() {
			processor.setGridDimensions({x:10, y:10});
			var quadrant0 = processor.getCorner(0);
			var quadrant1 = processor.getCorner(1);
			var quadrant2 = processor.getCorner(2);
			var quadrant3 = processor.getCorner(3);
			var quadrantN = processor.getCorner(100);

			expect(quadrant0.orientation).to.equal(Math.PI/2);
			expect(quadrant0.x).to.equal(0);
			expect(quadrant0.y).to.equal(0);

			expect(quadrant1.orientation).to.equal(0);
			expect(quadrant1.x).to.equal(0);
			expect(quadrant1.y).to.equal(9);

			expect(quadrant2.orientation).to.equal(-Math.PI/2);
			expect(quadrant2.x).to.equal(9);
			expect(quadrant2.y).to.equal(9);

			expect(quadrant3.orientation).to.equal(Math.PI);
			expect(quadrant3.x).to.equal(9);
			expect(quadrant3.y).to.equal(0);

			expect(quadrantN.orientation).to.equal(Math.PI/2);
			expect(quadrantN.x).to.equal(0);
			expect(quadrantN.y).to.equal(0);
		});
});
