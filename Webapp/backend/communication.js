/*
  Module to create and parse data to and from robots

  Messages to robots
 * 0 - stop
 * 1 - start/resume
 * 2 - go to tile + coordinates [x,y]

 Messages from the robot
 * position [x,y]
 * light intensity
*/

net = require('net');

var server = net.createServer(function(socket) {
	socket.write('stuff');
	socket.pipe(socket);
});

server.listen(8000, '127.0.0.1');

var processor = require('./processing');

/* Messages to Robot */
var resume = function(robotID) {
	// resume a robot that has been stopped
}

var stop = function(robotID) {
	// Stop a robot from moving
}

var stopAll = function() {
  // Stop all robots from moving
  // Send stop message to all IPs of robots.
}

var changeOrientation = function(degree) {
  // turn robot degree degrees clockwise
}

exports.resume = resume;
exports.stop = stop;
exports.stopAll = stopAll;
exports.changeOrientation = changeOrientation;
