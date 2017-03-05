/* February 2017
 * Jackson Woodruff
 */

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
	var size = processor.getGridSize();
	updateGrid(size, size);

	socket.on('startRobots', function(input) {

		var numTiles = input.gridSize / input.tileSize;

		// ready?
		processor.setTileSize(Number(input.tileSize));
		// READY?
		processor.setGridDimensions(numTiles);
		// GO!!
		processor.startProcessing();
	});

});

exports.updateGrid = updateGrid;
exports.updateStatus = updateStatus;
exports.updateTile = updateTile;
