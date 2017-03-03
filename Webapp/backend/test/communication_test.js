var expect = require('chai').expect;
var coms = require('../communication.js');
var processor = require('../processing.js');
var net = require('net');

var CONNECTION_PORT = 9000;

describe('should be in test mode', function() {
	expect(coms.TEST).to.equal(true);
});

describe('opening a connection to the TCP socket', function() {
	it('should work from localhost', function(done) {
		net.connect({port:9000}, function() {
			done();
		});
	});

	it('should work from another host', function(done) {
		require('dns').lookup(require('os').hostname(),
			function (err, add, fam) {
				net.connect({port: 9000, host: add}, function() {
					done();
				});
			});
	});
});

describe('getRobotByID', function() {
	it('should get a robot by Id if one has been added', function() {
		coms.addRobotByID(1, {destroyed: false, write: function() {}});

		expect(coms.getRobotByID(1)).to.not.be.null;
	});

	it('should return null otherwise', function() {
		expect(coms.getRobotByID(-1)).to.be.null;
	});
});

describe('Test tcp server', function() {
	var client;

	it('should accept a connection', function(done) {
		client = net.connect({port: 9000}, function() {
			expect(true, 'client did not connect').to.be.true;

			// send some data to the server. We expect it to only parse
			// the data upon receipt of the \n
			client.write('some data');
			client.write('\n');
			done();
		});
	});

	it('should accept two messages at once', function(done) {
		client.write('{"type": "HELLO"}{"type": "HELLO"}');
		done();
	});
});

describe('wait message', function() {
	it('should send out a wait message to the connected (specified) client',
		function(done) {
			var client = net.connect({port:9000}, function() {
				client.write('{"type":"HELLO", "id":1}');
			});

			client.on('data', function(data) {
				expect(data.toString()).to.equal('{"type":"WAIT", "time":3000}');
				done()
			});

			setTimeout(function() {
				coms.wait(1);
				console.log("ROBOTS" + coms.robots);
			}, 100);
	});
});

describe('robot list management', function() {
	it('should add connections ok', function() {
		coms.addRobotByID(0, {destroyed: false, write: function() {}});
		coms.addRobotByID(4, {destroyed: false, write: function() {}});

		expect(coms.robots.length).to.equal(5); // NOTE added another in move test
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

	it('RESET message should reset the position of the robot', function() {
			processor.robots[1].xPrev = 0;
			processor.robots[1].yPrev = 0;
			coms.receiveData('RESET:1');
			expect(processor.robots[1].xPrev).to.equal(0);
			expect(processor.robots[1].yPrev).to.equal(0);
	});

	it('should work when DONE messages are sent', function() {
		coms.receiveData("DONE:2\n");
		coms.receiveData("DONE:\n");
		coms.receiveData("DONE:10000");
	});

	it('INTENSITY messages ', function() {
		coms.receiveData("INTENSITY:2;(12, 3, 9); (12, 4)\n");
		coms.receiveData("INTENSITY:3;(N,N,N)\n");
		coms.receiveData("INTENSITY:();(; ;)\n");
	});

	it('should send a message to the robot',
		function(done) {
			// To test this, we need some tiles set in processing.
			processor.setRobotStates(5);
			processor.setGridDimensions({x: 10, y: 10});
			var instructionsSent = false;
			// This is done because this can be triggered at a later
			// date by another test.
			var doneCalled = false;
			coms.receiveData("HELLO: 2\n",
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
			coms.receiveData("DONE: 2\n");

			setTimeout(function() {
				expect(instructionsSent,
					' robot failed to receive instructions').to.be.true;
			}, 100);
	});

	it('should not crash easily', function() {
		coms.receiveData("INTENSITY:()\n");
		coms.receiveData("INTENSITY:;101JIAADFlfkdsjfalskdjffa\n");
		coms.receiveData("INTENSITY:(-100, -100, 10000000)\n");
		coms.receiveData("INTENSITY:(1, 10)\n");
		coms.receiveData("INTENSITY:((()))))\n");
		coms.receiveData("HELLO:DATA\n");
		coms.receiveData("HELLO:9999999999999999999999999999999999999999999999\n\n")
		coms.receiveData("HELLO:-10101\n");
		coms.receiveData("HELLO:-\n");
		coms.receiveData("HELLO:1e400000\n");
		coms.receiveData("HELLO:1.01\n");
		coms.receiveData("BYEBYE:\n");
		coms.receiveData("INTENSITY:\n");
		coms.receiveData("yyyyyyyyyyyyyyhhhh\n");
		coms.receiveData("HELLO: 1 1 1 2 3 3 3\n");
		coms.receiveData("\n");

		expect(true, 'server did not crash').to.be.true;
	});
});

describe('stop, resume and stopAll', function() {
	var dataReceived;
	var dataReceived2;
	it('should add a robot with a callback', function() {
		// Add a couple of robots
		coms.receiveData("HELLO:1\n", {destroyed: false, write:
			function(data) {
				dataReceived = data;
			}});
		coms.receiveData("HELLO:2\n", {destroyed: false, write:
			function(data) {
				dataReceived2 = data;
			}});
	});

	it('stop should send out a STOP\n message', function() {
		coms.stop(1);
		expect(dataReceived).to.equal('STOP\n');
	});

	// it('resume should send out a RESUME\n message', function() {
	// 	coms.resume(1);
	// 	expect(dataReceived).to.equal('RESUME\n');
	// });

	it('stop all should sent out some STOP\n messages', function() {
		coms.stopAll();
		expect(dataReceived).to.equal('STOP\n');
		expect(dataReceived2).to.equal('STOP\n');
	});
});

describe('Move function sending instructions to robot', function() {

	coms.addRobotByID(3, {destroyed: false, write: function() {}});
	processor.resetRobot(3);
	var robot = coms.getRobotByID(3);
	console.log(robot);
	coms.move(3, 0, 42);
	coms.move(3, Math.PI/3, 35);
	coms.move(3, Math.PI/6, 12);
	coms.move(3, Math.PI/60, 36);

	it('Robot should have received instructions to move', function(done) {
		var instructionsSent = false;
		var doneCalled = false;
		processor.setRobotStates(5);
		processor.setGridDimensions({x:10, y:10});
		processor.startProcessing();

		coms.receiveData("HELLO: 3\n",
			{destroyed: false, write: function(message) {
				instructionsSent = true;

				if (message !== "STOP\n" && message !== "RESUME\n" && !doneCalled) {
					var contents = message.split(', ');
					expect(contents.length).to.equal(6);
				}
				if (!doneCalled) {
					doneCalled = true;
					done();
				}
			}
		});

		coms.receiveData("DONE: 3\n",
			{destroyed: false, write: function(message) {
				instructionsSent = true;

				if (message !== 'STOP\n' && message !=='RESUME\n'){
					var contents = message.split(', ');
					expect(contents.length).to.equal(6);
				}
			}
		});

		setTimeout(function() {
			expect(instructionsSent,
				'Robot failed to receive instructions').to.be.true;
		}, 100);
	});

});
