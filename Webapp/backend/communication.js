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


// NOTE -- Unlike the rest of the application,
// this array is not indexed by ID.
robots = [];

net = require('net');
processor = require('./processing');

var server = net.createServer(function(socket) {
	socket.pipe(socket);

	socket.on('data', function(data) {
		// TODO -- only call this on a synchronization message
		// addRobotByID(data.id, socket);
		addRobotByID(0, socket);

		console.log('data ' + data);
		// Get from the robots:
		//		Robot ID
		//		Light Intensities list (lightIntensity, x, y)
		//
		// Need to calculate a new position based on that

		// set the tiles. this calls communication.move().
		var dummyMessage = [{x: 0, y: 0, lightIntensity: 1}]
		// processor.setTile(data.id, data.intensities);
		processor.setTile(0, dummyMessage);
	});
});

var addRobotByID = function(robotID, socket) {
  // /console.log(socket);
	// Check if the robot is in the robots list.
	// If not then add it. Otherwise, update the socket.
	for (var i = 0; i < robots.length; i++) {
		if (robots[i].id === robotID) {
			// update the socket and return
			robots[i].socket = socket;
			return;
		}
	}
	// Otherwise add a new entry into the list.
	robots.push({id: robotID, socket: socket});
};

// Idea is to return the socket of a particular
// robot in the system. Returns null
// if the robot is not found.
var getSocketByID = function(robotID) {
	for(var i = 0; i < robots.length; i ++) {
		if (robotID === robots[i].id) {
			return robots[i].socket;
		}
	}
	return null;
}

server.listen(8000, '127.0.0.1');

var processor = require('./processing');

/* Messages to Robot */
var resume = function(robotID) {
	var socket = getSocketByID(robotID);

	// todo -- deal with a null socket
	// todo -- actually send a resume message
}

var stop = function(robotID) {
	// Stop a robot from moving
	var socket = getSocketByID(robotID);

	// todo -- deal with a null socket
	// todo -- actually send a resume message
}

var stopAll = function() {
	// Stop all robots from moving
	// Send a stop message to all connected
	for (var i = 0; i < robots.length; i ++) {
		// todo, check if socket is open and stop it.
	}
}

var move = function(robotID, degree, distance) {
	// turn robot degree degrees clockwise
	// TODO -- move the robot
	var socket = getSocketByID(robotID);

	console.log('id ' + robotID.toString() + ' Degree:' + degree.toString()
		+ ' Distance: ' + distance.toString());
}

exports.resume = resume;
exports.stop = stop;
exports.stopAll = stopAll;
exports.move = move;
