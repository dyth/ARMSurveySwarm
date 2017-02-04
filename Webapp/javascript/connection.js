// Need to have the socket.io 
// file loaded.

var socket = io('localhost');

socket.on('receiveRobotStatus', function(data) {
	// todo -- do stuff with that
});

socket.on('receiveRobotPositions', function(data) {
	// todo -- use that data.
});

var stop = function() {
	socket.emit('stop');
}

var resume = function() {
	socket.emit('resume');
}
