/*
  Module to create and parse data to and from robots

  Messages to robots
 * 0 - stop
 * 1 - start/resume
 * 2 - go to tile + coordinates [x,y]

 Messages from the robot
 * position [x,y]
 * light intensity

 Messages to web app
 updateTile
 updateStatus
 updateGrid

*/
var processor = require('./processing');

var resume = function(robotID) {
	// resume a robot that has been stopped
}

var stop = function(robotID) {
	// Stop a robot from moving
}

exports.resume = resume;
exports.stop = stop;
