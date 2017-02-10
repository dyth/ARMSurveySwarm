var http = require('http');
var express = require('express');
var path = require('path');
var app = express();
var server = http.createServer(app);
var processor = require('./processing');

// This sets the server to serve the files
// in the folder above when they
// are requrested by path.
app.use(express.static('../'));

// These map URLs to files.
app.get('/', function(req, res) {
	res.render('../index.html');
});

app.get('/run', function(req, res) {
	res.render('../run.html');
});

// Attaches soocket.io to the server that we
// have set up.
var io = require('socket.io').listen(server);
server.listen(80);

// These are broadcast functions. When called
// they will send updates to all clients connected.
var updateStatus = function(robotID, x, y, status) {
	// todo fix this up
	io.emit('sendRobotStatus', {id: 1, x: x, y: y, status: status});
};

var updateGrid = function(x, y) {
	io.emit('sendAreaDimensions', {xDim: 10, yDim: 10});
};

var updateTile = function(x, y, tileValue) {
	io.emit('sendRobotPositions', {x: 0, y: 0, value: 'unsure'});
};

io.sockets.on('connection', function(socket) {
	console.log('send on connection');
	// The functions in this are caller per client
	// instance.
	socket.emit('sendAreaDimensions', {xDim: 10, yDim: 10});

	socket.on('stop', function(robot) {
		processor.stop(robot);

		// For testing purposes only.
		socket.emit('stopCalled');
	});

	socket.on('stopAll', function () {
		processor.stopAll();

		// For testing purposes only.
		socket.emit('stopAllCalled');
	});

	socket.on('resume', function(robot) {
		processor.resume(robot);

		// For testing purposes only.
		socket.emit('resumeCalled');
	});

	socket.on('startRobots', function(input) {
		console.log(input.tileSize);
		console.log(input.gridSize);
		processor.receiveTileSize(input.tileSize, input.gridSize);
	});

	setTimeout(function () {

		console.log("Updating tile");
		io.emit('sendTileUpdate', {x: 0, y: 0, value: 1});
		io.emit('sendTileUpdate', {x: 9, y: 0, value: 1});
		io.emit('sendTileUpdate', {x: 0, y: 9, value: 1});
		io.emit('sendTileUpdate', {x: 9, y: 9, value: 1});

	}, 1000);

});

exports.updateGrid = updateGrid;
exports.updateStatus = updateStatus;
exports.updateTile = updateTile;
