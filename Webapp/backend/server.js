var http = require('http');
var express = require('express');
var path = require('path');
var app = express();
var server = http.createServer(app);

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
var sendStatus = function(robot, status) {
	// todo fix this up
	io.emit('sendRobotStatus', {id: 1, status: 'running'});
}

var sendPositions = function(robot, position) {
	io.emit('sendRobotPositions', {x: 0, y: 0, value: 'unsure'});
};

io.sockets.on('connection', function(socket) {
	console.log('send on connection');
	// The functions in this are caller per client
	// instance.
	io.sockets.emit('sendAreaDimensions', {xDim: 10, yDim: 10});

    socket.on('stop', function(robot) {
        // todo stop the robotz
    });

    socket.on('resume', function(robot) {
        // todo rezume ze robotz
    });
		
	io.sockets.on('sendTileSize', function(tileSize) {
		// todo, pass tileSize.size on to robots.
	});

	setTimeout(function() {
		io.sockets.emit('sendAreaDimensions', {xDim: 10, yDim: 10});
	}, 10000);

    socket.on('startRobots', function(input) {
        // todo, pass tileSize.size on to robots, Start robot calibration
        console.log(input.size);
    });

	// Some test data
	var testFunction = function() {
		var x = Math.floor(Math.random() * 10);
		var y = Math.floor(Math.random() * 10);
		var value = Math.random() > 0.5 ? 1 : 0;
		socket.emit('sendTileUpdate', {x: 6, y: 6, value: 1});

		//setTimeout(testFunction, 1000);
	};
	setTimeout(testFunction, 1000);
});
