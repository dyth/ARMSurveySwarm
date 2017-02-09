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
}

var changeOrientation = function(degree) {
  // turn robot degree degrees clockwise
}

exports.resume = resume;
exports.stop = stop;
exports.stopAll = stopAll;
exports.changeOrientation = changeOrientation;
