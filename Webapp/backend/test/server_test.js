var io = require('socket.io-client');
var expect = require('chai').expect;
var server = require('../server');
var processing = require('../processing');

server.TEST = true;

var socketURL = 'http://0.0.0.0:80';

var options = {
	transports: ['websocket'],
	'force new connection': true
}

describe('calling updateTile', function() {
	it('should trigger an update for the sendTileData function ' +
		'without reordering data', function(done) {
		var client = io.connect(socketURL, options);
		var tileData = [];

		client.on('connect', function() {
			server.updateTile(10, 10, 3);
			server.updateTile(10, 10, 1);
			server.updateTile(5, 1, 0);
		});

		client.on('sendTileData', function(data) {
			tileData.push(data);

			if (tileData.length === 3) {
				done();
			}
		});

		setTimeout(function() {
			expect(tileData.length).to.equal(3);
			expect(tileData[0].x).to.equal(10);
			expect(tileData[0].y).to.equal(10);
			expect(tileData[0].value).to.equal(3);
			expect(tileData[1].value).to.equal(1);
			expect(tileData[2].value).to.equal(0);
		}, 300);
	});
});
describe('Calling updateStatus', function() {
	it('should trigger a broadcast with the robot status', function(done) {
		var clients = [];
		var receivedData1 = [];
		var receivedData2 = [];
		var NUM = 50;
		var connections = 0;

		// initialize all the clients.
		for (var i = 0; i < NUM; i ++) {
			var newClient = io.connect(socketURL, options);

			newClient.on('sendRobotStatus', function(data) {
				if (data.id === 1) {
					receivedData1.push(data);
				} else {
					receivedData2.push(data);
				}

				if (receivedData1.length === NUM
					&& receivedData2.length === NUM) {
					done();
				}
			});

			newClient.on('connect', function() {
				connections ++;

				if (connections == NUM) {
					// If all the servers are connected, then
					// run the broadcasts.
					server.updateStatus(1, 10, 5, 'running');
					server.updateStatus(3, 2, 1, 'stopped');

				}
			});

			clients.push(newClient);
		}

		setTimeout(function() {
			expect(receivedData1.length, "not all clients received" +
			" message 1: " + receivedData2.length.toString ()+ "/"
				+ NUM.toString() + "\n").to.equal(NUM);
			expect(receivedData2.length, "not all clients received" +
			" message 2: " + receivedData2.length.toString() + "/" +
				NUM.toString() + "\n").to.equal(NUM);

			for (var i = 0; i < receivedData1.length; i ++) {
				expect(receivedData1[i].id).to.equal(1);
				expect(receivedData1[i].x).to.equal(10);
				expect(receivedData1[i].y).to.equal(5);
				expect(receivedData1[i].status).to.equal('running');
			}

			for (var i = 0; i < receivedData2.length; i ++) {
				expect(receivedData2[i].id).to.equal(3);
				expect(receivedData2[i].x).to.equal(2);
				expect(receivedData2[i].y).to.equal(1);
				expect(receivedData2[i].status).to.equal('stopped');
			}
		}, 600);
	});
});

describe('Calling updateGrid', function() {
	it('should trigger a boradcast with new area dimensions', function(done) {
		var client1 = io.connect(socketURL,  options);
		var client2 = io.connect(socketURL,  options);

		var receivedData = [];
		var client1Received = false;
		var client2Received = false;
		client1.on('sendAreaDimensions', function(data) {
			receivedData.push(data);
			client1Received = true;
			if (client1Received && client2Received) {
				done();
			}
		});

		client2.on('sendAreaDimensions', function(data) {
			receivedData.push(data);
			client2Received = true;
			if (client1Received && client2Received) {
				done();
			}
		});

		server.updateGrid(10, 20);

		setTimeout(function() {
			expect(receivedData[0].xDim, 'x data').to.equal(10);
			expect(receivedData[0].yDim, 'y data').to.equal(20);
			expect(receivedData[1].xDim, 'x data').to.equal(10);
			expect(receivedData[1].yDim, 'y data').to.equal(20);

			client1.disconnect();
			client2.disconnect();
		}, 1000);
	});
});

describe('Stop Function Test', function() {
	it('should return an ack by emitting "stopCalled"', function(done) {
		var client = io.connect(socketURL, options);
		var connected = false;
		var stop = false;
		var resume = false;
		var stopAll = false;

		client.on('connect', function(data) {
			client.emit('stop', {id: 1});
			connected = true;
		});

		client.on('stopCalled', function(data) {
			stop = true;
			client.emit('resume', {id: 1});
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

describe('start processing message', function(done) {
	var client = io.connect(socketURL, options);

	it('sending startRobots should result in the system being started',
		function() {
			client.emit('startProcessing', {tileSize: 1, gridSize: 1,
					numRobots: 10});

			setTimeout(function() {
				expect(processor.startedProcessing).to.be.true;
				done();
			}, 100);
	});
});
