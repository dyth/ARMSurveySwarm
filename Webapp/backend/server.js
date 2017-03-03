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
};

var updateGrid = function(x, y) {
	io.emit('sendAreaDimensions', {xDim: x, yDim: y});
};

var updateTile = function(x, y, tileValue) {
	io.emit('sendTileData', {x: x, y: y, value: tileValue});
};

io.sockets.on('connection', function(socket) {
	// The functions in this are caller per client
	// instance.
	var dim = processor.getGridDimensions();
	updateGrid(dim.x, dim.y);
	socket.on('stop', function(robot) {
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
		// console.log("tile size " + input.tileSize.toString());
		// console.log("grid size " + input.gridSize.toString());

		var numTiles = input.gridSize / input.tileSize;

		// console.log("num tiles " + numTiles);
		console.log("Robots: " + input.numRobots);

		// ready?
		processor.setTileSize(Number(input.tileSize));
		// READY?
		processor.setGridDimensions({x: numTiles, y: numTiles});
		// SET?
		for (var i = 0; i < numRobots; i ++) {
			processor.addRobotToList(i);
		}
		// GO!!
		processor.startProcessing();
	});

});

exports.updateGrid = updateGrid;
exports.updateStatus = updateStatus;
exports.updateTile = updateTile;
