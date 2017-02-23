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

		expect(coms.robots.length).to.equal(2);
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
					
					if (message !== "STOP" && message !== "RESUME") {
						// In this case it must be a data message
						var contents = message.split(',');
						expect(contents.length, '3 things sent to robot').to.equal(3);
					} else {
						if (!doneCalled) {
							// This is NOT the order that was expected
							expect(false, 
								'messages delivered in wrong order. Expecting directions, got ' +
									message).to.be.true;
						}
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
				expect(instructionsSent, ' robot failed to receive instructions').to.be.true;
			}, 100);
	});
});
