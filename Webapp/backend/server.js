// Assume a nodejs implementation for now
var io = require('socket.io').listen(80);

io.sockets.on('getRobotStatus', function() {
	// todo -- get some actual statuses :) 
	emit('receiveRobotStatus', {data: [{id: 1, status: false}, 
										{id: 2, status:true}]});
});

io.sockets.on('getRobotPositions', function() {
	emit('receiveRobotPositions', {data: [{id: 1, pos: [(1, 2), (2, 3)]}, 
										{id: 1, pos: [(1, 2), (2, 3)]}]});
});

io.sockets.on('stop', function() {
	// todo stop the robotz
});

io.sockets.on('resume', function() {
	// todo rezume ze robotz
});

// And setup the actual server:
var connect = require('connect');
var server = require('serve-static');
connect().use(server('../')).listen(8080, function() {
	console.log("running server on 8080");
});

