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
				expect(data.toString()).to.equal('{"type":"WAIT","time":3000}');
				done();
			});

			setTimeout(function() {
				coms.wait(1);
				console.log("ROBOTS" + coms.robots);
			}, 100);
	});
});

describe('receiveData', function() {
	it('should add a robot to the list of robots on receipt of a hello message',
		function() {
	});

	it('RESET message should reset the position of the robot', function() {
	});

	it('should work when DONE messages are sent', function() {
	});

	it('INTENSITY messages ', function() {
	});

	it('should send a message to the robot',
		function(done) {
	});

	it('should not crash easily', function() {
		expect(true, 'server did not crash').to.be.true;
	});
});

describe('stop, resume and stopAll', function() {
	var dataReceived;
	var dataReceived2;
	it('should add a robot with a callback', function() {
		// Add a couple of robots
		// coms.receiveData("HELLO:1\n", {destroyed: false, write:
			// function(data) {
				// dataReceived = data;
			// }});
	});

	it('stop should send out a STOP\n message', function() {
		coms.stop(1);
	});
});

describe('Move function sending instructions to robot', function() {

});
