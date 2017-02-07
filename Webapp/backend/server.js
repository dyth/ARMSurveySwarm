// Assume
var http = require('http');
var express = require('express');
var path = require('path');
var app = express();
var server = http.createServer(app);

app.use(express.static('../'));

app.get('/', function(req, res) {
	res.render('../index.html');
});

app.get('/run.html', function(req, res) {
	res.render('../run.html');
});

var io = require('socket.io').listen(server);
server.listen(80);

var sendStatus = function(robot, status) {
	// todo fix this up
	io.emit('sendRobotStatus', {id: 1, status: 'running'});
}

var sendPositions = function(robot, position) {
	io.emit('sendRobotPositions', {x: 0, y: 0, value: 'unsure'});
};

// Send some default information to the client
io.sockets.on('connection', function(socket) {
	console.log('send on connection');
	io.sockets.emit('sendAreaDimensions', {xDim: 10, yDim: 10});

    socket.on('stop', function(robot) {
        // todo stop the robotz
    });

    socket.on('resume', function(robot) {
        // todo rezume ze robotz
    });

    socket.on('startRobots', function(input) {
        // todo, pass tileSize.size on to robots, Start robot calibration
        console.log(input.size);
    });

	var testFunction = function() {
		console.log('test function called');
		var x = Math.floor(Math.random() * 10);
		var y = Math.floor(Math.random() * 10);
		var value = Math.random() > 0.5 ? 1 : 0;
		socket.emit('sendTileUpdate', {x: x, y: y, value: value});

		setTimeout(testFunction, 1000);
	};
	setTimeout(testFunction, 1000);
});

