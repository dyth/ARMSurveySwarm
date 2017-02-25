var expect = require('chai').expect;
var coms = require('../communication.js');
var processor = require('../processing.js');
var net = require('net');

describe('should be in test mode', function() {
	expect(coms.TEST).to.equal(true);
});

describe('getRobotByID', function() {
	it('should get a robot by Id if one has been added', function() {

	});

	it('should return null otherwise', function() {

	});
});

describe('Test tcp server', function() {
	var client;

	it('should accept a connection', function(done) {
		client = net.connect({port: 8000}, function() {
			expect(true, 'client did not connect').to.be.true;

			// send some data to the server. We expect it to only parse
			// the data upon receipt of the \n
			client.write('some data');
			client.write('\n');
			done();
		});
	});

	it('should accept a fragmented message', function(done) {
		client.write('HELLO:1\n');
		client.write('DONE:1\n');

		client.on('data', function() {
			console.log(coms.robots);
			expect(coms.getRobotByID(1).socket.destoryed).to.equal(false);
			done();
		});
	});

	it('should accept two messages at once', function(done) {
		client.write('HELLO:2\nDONE:2\n');
		done();
	});
});

describe('robot list management', function() {
	it('should add connections ok', function() {
		coms.addRobotByID(0, {destroyed: false, write: function() {}});
		coms.addRobotByID(4, {destroyed: false, write: function() {}});

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

	coms.addRobotByID(3, {destroyed: false, write: function() {}});
	var directions = ['forward', 'backward','left', 'right'];
	var secondaryDirections = ['forward', 'forward'];

	var durations = ['8750', '7292', '0375', '1088'];
	var secondaryDurations = ['2500', '7500'];


	var robot = coms.getRobotByID(3);
	console.log(robot);

	it('Robot set to move for 42cm with degree 0 should' +
		' just send one move forward message for 8.75s', function(){
		coms.move(3, 0, 42);
		expect(robot.nextMove).to.be.null;

	});

	it('Robot should have received instructions to move', function(done) {
		var instructionsSent = false;
		var doneCalled = false;
		var n = 0;
		var m = 0;

		coms.receiveData("HELLO: 3\n",
			{destroyed: false, write: function(message) {
				instructionsSent = true;

				if (message !== "STOP\n" && message !== "RESUME\n" && !doneCalled) {
					var contents = message.split(', ');
					//e.g. ['direction = backward', ' speed = 5000', ' duration = 7292']
					expect(contents[0]).to.equal('direction = ' + directions[n]);
					expect(contents[1]).to.equal('speed = 5000');
					expect(contents[2]).to.equal('duration = ' + durations[n]);
					console.log(contents);
				}
				if (!doneCalled) {
					doneCalled = true;
					done();
				}
			}
		});
		n += 1;

		coms.receiveData("DONE: 3\n",
			{destroyed: false, write: function(message) {
				instructionsSent = true;

				if (message !== 'STOP\n' && message !=='RESUME\n'){
					var contents = message.split(', ');
					expect(contents[0]).to.equal('direction = ' + directions[m]);
					expect(contents[1]).to.equal('speed = 5000');
					expect(contents[2]).to.equal('duration = ' + durations[m]);
				}
			}
		});
		m += 1;

		setTimeout(function() {
			expect(instructionsSent,
				'Robot failed to receive instructions').to.be.true;
		}, 100);
	});

	it('Robot set to move for 35cm with degree 180 should' +
		' just send one move backwards message for 7.29s', function(){
		coms.move(3, Math.PI, 35);
		expect(robot.nextMove).to.be.null;

	});

	it('Robot set to move for 12cm with degree 30 should' +
		' rotate left 0.375s then move forward 2.5s', function(){
		coms.move(3, Math.PI/6, 12);
		expect(robot.nextMove).to.be.not.null;

	});

	it('Robot set to move for 36cm with degree 273 should' +
		' rotate right 1.088s then move forward 7.5s', function(){
		coms.move(3, 91*Math.PI/60, 36);
		expect(robot.nextMove).to.be.not.null;

	});
});
