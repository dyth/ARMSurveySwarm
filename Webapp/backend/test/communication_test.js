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

describe('Test tcp server', function() {
	var client;

	it('should accept a connection', function(done) {
		client = net.connect({port: 9000}, function() {
			expect(true, 'client did not connect').to.be.true;

			client.write('some data');
			done();
		});
	});

	it('should be able to receive json data', function(done) {
		client.write('{"type":"HELLO", "id": 1}');

		setTimeout(function() {
			console.log('ROBOTS ' + processor.robots);
			expect(coms.robots[1]).to.exist;
			expect(processor.robots[1]).to.exist;
			done();
		}, 100);
	});

	it('should be able to connect to at least 4 clients', function() {
		// TODO
		// expect(coms.server.maxConnections).to.be.at.least(4);
	});
});

describe('receiveData', function() {
	it('should add a robot to the list of robots on receipt of a hello message',
		function() {
			coms.robots.length = 0;
			var initialProcessorLength = processor.robots.length;
			coms.receiveData({type: "HELLO", id: 0}, {});

			expect(coms.robots.length).to.equal(1);
			expect(processor.robots.length).to.equal(
				Math.max(1, initialProcessorLength));
	});

	it('should not crash when DONE messages are sent', function() {
		coms.receiveData({type: "DONE", intensities: [1, 2, 3], id: 0}, {});
	});


	it('a done message should result in the done count in processing increasing',
		function() {
			coms.robots[0] = {destroyed: false, write: function() {}};
			var originalCount = processor.waitingRobots;

			coms.receiveData({type: "DONE", intensities: ["[1, 2]"], count: 0}, {});

			expect(processor.waitingRobots).to.equal(originalCount + 1);
	});


	it('should send a start message to the robot', function(done) {
		processor.robots.length = 0;
		coms.receiveData({type: "HELLO", id: 0},
			{destroyed: false, write: function(data) {
				var json = JSON.parse(data);
				expect(json).to.have.property("type", "START");
				expect(json).to.have.property("tileSize", 10);
				done();
			}});
		coms.sendStart(0, 10);
	});
});

describe('other sending functions', function() {
	it('sendStop should send a stop message',
		function(done) {
			processor.robots.length = 0;
			coms.receiveData({type: "HELLO", id: 0},
				{destroyed: false, write: function(data) {
					var json = JSON.parse(data);
					expect(json).to.have.property("type", "STOP");
					done();
			}});

			coms.sendStop(0);
			coms.robots[0] = undefined;
	});

	it('sendMove should send out a move message',
		function(done) {
			processor.robots.length = 0;
			coms.receiveData({type: "HELLO", id: 0},
				{destroyed: false, write: function(data) {
					var json = JSON.parse(data);
					expect(json).to.have.property("type", "MOVE");
					expect(json).to.have.property("angle",
							Math.round(1213 * 180.0 / Math.PI));
					expect(json).to.have.property("distance", Math.round(1231));
					done();
			}});

			coms.sendMove(0, 1213,  1231);
			coms.robots[0] = undefined;
	});
});
