var io = require('socket.io-client');
var expect = require('chai').expect;
var server = require('../server');

server.TEST = true;

var socketURL = 'http://0.0.0.0:80';

var options = {
	transports: ['websocket'],
	'force new connection': true
}

describe('Stop Function Test', function() {
	it('should return an ack by emitting "stopCalled"', function(done) {
		var client = io.connect(socketURL, options);
		var connected = false;
		var stop = false;
		var resume = false;
		var stopAll = false;

		client.on('connect', function(data) {
			client.emit('stop');
			connected = true;
		});

		client.on('stopCalled', function(data) {
			stop = true;
			client.emit('resume');
		});

		client.on('resumeCalled', function(data) {
			resume = true;
			client.emit('stopAll');
		});

		client.on('stopAllCalled', function(data) {
			stopAll = true;
			done();
		});

		setTimeout(function() {
			expect(connected,
				'client did not connect').to.equal(true);
			expect(stop, 
				'"stop" call did not return a callback').to.equal(true);
			expect(resume, 
				'"resume" call did not return a callback').to.equal(true);
			expect(stopAll, 
				'"stopAll" call did not return a callback').to.equal(true);
			client.disconnect();
		}, 1000);
	});
});
