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

// Attaches socket.io to the server that we
// have set up.
var io = require('socket.io').listen(server);
server.listen(80);

// These are broadcast functions. When called
// they will send updates to all clients connected.
var updateStatus = function(robotID, x, y, status) {
	// todo fix this up
	io.emit('sendRobotStatus', {id: robotID, x: x, y: y, status: status});
	console.log('status update emitted');
};

var updateGrid = function(x, y) {
	io.emit('sendAreaDimensions', {xDim: x, yDim: y});
};

var updateTile = function(x, y, tileValue) {
	io.emit('sendTileData', {x: x, y: y, value: tileValue});
	console.log('tile data sent');
};

io.sockets.on('connection', function(socket) {
	// The functions in this are caller per client
	// instance.

	// Update the board to start with:
	var gridSize = processor.getGridDimensions();
	socket.emit('sendAreaDimensions', {xDim: gridSize.x,
		yDim: gridSize.y});

	setTimeout(function() {
		updateGrid(10, 10);
		updateTile(0, 0, 1);
		updateTile(1, 0, 1);
		updateTile(3, 0, 1);
		updateTile(4, 0, 1);
		updateTile(5, 1, 1);
	}, 1000);

	setTimeout(function() {
		updateTile(9, 9, 1);
		updateStatus(0, 9, 9, 0);
	}, 5000);

	socket.on('stop', function(robot) {
		console.log('robot ' + robot.toString() + ' stopped');
		processor.stop(robot.id);

		// For testing purposes only.
		socket.emit('stopCalled');
	});

	socket.on('stopAll', function () {
		processor.stopAll();

		// For testing purposes only.
		socket.emit('stopAllCalled');
	});

	socket.on('resume', function(robot) {
		processor.resume(robot.id);

		// For testing purposes only.
		socket.emit('resumeCalled');
	});

	socket.on('startRobots', function(input) {
		console.log("tile size " + input.tileSize.toString());
		console.log("grid size " + input.gridSize.toString());
		// ready? 
		processor.setTileSize(input.tileSize);
		// READY?
		processor.setGridDimensions({x: input.gridSize, y: input.gridSize});
		// SET?
		processor.createTilesList();
		// GO!!
		processor.startProcessing();
	});

});

exports.updateGrid = updateGrid;
exports.updateStatus = updateStatus;
exports.updateTile = updateTile;
