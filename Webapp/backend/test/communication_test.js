var expect = require('chai').expect;
var coms = require('../communication.js');
var processor = require('../processing.js');

describe('should be in test mode', function() {
	expect(coms.TEST).to.equal(true);
});

describe('robot list management', function() {
	it('should add connections ok', function() {
		coms.addRobotByID(0, {destroyed: false, write: function() {}});
		coms.addRobotByID(5, {destroyed: false, write: function() {}});

		expect(coms.robots.length).to.equal(3); // NOTE added another in move test
		expect(coms.robots[1].socket.destroyed).to.equal(false);
	});

	it('should retrieve robots', function() {
		var robot0Socket = coms.getSocketByID(0);
		expect(robot0Socket.destroyed).to.equal(false);
	});

	it('should retrieve only live connections', function() {
		coms.addRobotByID(3, {destroyed: true, write: function() {}});

		var connected = coms.getConnectedRobots();

		for (var i = 0; i < connected.length; i ++) {
			expect(connected[i].id).to.not.equal(3);
		}
	});
});

describe('receiveData', function() {
	it('should add a robot to the list of robots on receipt of a hello message',
		function() {
			coms.receiveData("HELLO: 1",
				{test: 100, destroyed: false, write: function() {}});
			var socket = coms.getSocketByID(1);

			expect(socket.test).to.equal(100);
	});

	it('should send a message to the robot',
		function(done) {
			// To test this, we need some tiles set in processing.
			processor.setGridDimensions({x: 10, y: 10});
			var instructionsSent = false;
			// This is done because this can be triggered at a later
			// date by another test.
			var doneCalled = false;
			coms.receiveData("HELLO: 2",
				{destroyed: false, write: function(message) {
					instructionsSent = true;

					if (message !== "STOP\n" && message !== "RESUME\n") {
						// In this case it must be a data message
						var contents = message.split(',');
						expect(contents.length, '3 things sent to robot').to.equal(3);
						console.log(contents);
					}

					if (!doneCalled) {
						doneCalled = true;
						done();
					}
				}
			});
			coms.receiveData("DONE: 2");
			coms.robots = [];

			setTimeout(function() {
				expect(instructionsSent,
					' robot failed to receive instructions').to.be.true;
			}, 100);
	});

	it('should not crash easily', function() {
		coms.receiveData("INTENSITY:()");
		coms.receiveData("INTENSITY:;101JIAADFlfkdsjfalskdjffa");
		coms.receiveData("INTENSITY:(-100, -100, 10000000)");
		coms.receiveData("INTENSITY:(1, 10)");
		coms.receiveData("INTENSITY:((()))))");
		coms.receiveData("HELLO:DATA");
		coms.receiveData("HELLO:9999999999999999999999999999999999999999999999")
		coms.receiveData("HELLO:-10101");
		coms.receiveData("HELLO:-");
		coms.receiveData("HELLO:1e400000");
		coms.receiveData("HELLO:1.01");
		coms.receiveData("BYEBYE:");
		coms.receiveData("INTENSITY:");
		coms.receiveData("yyyyyyyyyyyyyyhhhh");
		coms.receiveData("HELLO: 1 1 1 2 3 3 3");
		coms.receiveData("");

		expect(true, 'server did not crash').to.be.true;
	});
});

describe('stop, resume and stopAll', function() {
	var dataReceived;
	var dataReceived2;
	it('should add a robot with a callback', function() {
		// Add a couple of robots
		coms.receiveData("HELLO:1", {destroyed: false, write:
			function(data) {
				dataReceived = data;
			}});
		coms.receiveData("HELLO:2", {destroyed: false, write:
			function(data) {
				dataReceived2 = data;
			}});
	});

	it('stop should send out a STOP\n message', function() {
		coms.stop(1);
		expect(dataReceived).to.equal('STOP\n');
	});

	it('resume should send out a RESUME\n message', function() {
		coms.resume(1);
		expect(dataReceived).to.equal('RESUME\n');
	});

	it('stop all should sent out some STOP\n messages', function() {
		coms.stopAll();
		expect(dataReceived).to.equal('STOP\n');
		expect(dataReceived2).to.equal('STOP\n');
	});
});

describe('Add padding', function() {
	it('should pad a number out to N digits and preserve equality', function() {
		// Checking length properties
		expect(coms.addPadding(1, 10).length).to.equal(10);
		expect(coms.addPadding(5, 2).length).to.equal(2);
		expect(coms.addPadding(-5, 3).length).to.equal(3);

		// checking preservation properties
		expect(Number(coms.addPadding(5, 2))).to.equal(5);
		expect(Number(coms.addPadding(-5, 4))).to.equal(-5);
	});

	it('should round floating point numbers', function() {
		expect(Number(coms.addPadding(1/3, 10))).to.equal(0);
		expect(Number(coms.addPadding(2/3, 1))).to.equal(1);

		expect(coms.addPadding(23.1, 3)).to.equal("023");
	});
});

describe('Move function sending instructions to robot', function() {
	// TODO -- get Kamile to write tests for this one
	coms.addRobotByID(6, {destroyed: true, write: function() {}});
	var robot = coms.getRobotByID(6);
	console.log(robot);

	it('Robot set to move for 50cm with degree 0 should' +
		' just send one move forward message for 10.42s', function(){
			coms.move(6, 0, 50);
			expect(robot.nextMove).to.be.null;

	});

	it('Robot set to move for 35cm with degree 180 should' +
		' just send one move backwards message for 7.29s', function(){
			coms.move(6, Math.PI, 35);
			expect(robot.nextMove).to.be.null;

	});

	it('Robot set to move for 12cm with degree 30 should' +
		' rotate left 0.375s then move forward 2.5s', function(){
			coms.move(6, Math.PI/6, 12);
			expect(robot.nextMove).to.equal(function() {
				socket.write('direction = forward, speed = 5000, duration = 2500');
			});

	});

	it('Robot set to move for 36cm with degree 273 should' +
		' rotate right 1.088s then move forward 7.5s', function(){
			coms.move(6, 91*Math.PI/60, 36);
			expect(robot.nextMove).to.equal(function() {
				socket.write('direction = forward, speed = 5000, duration = 7500');
			});

	});
});
