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
var robots = [];
var TEST = true;

net = require('net');
processor = require('./processing');

var server = net.createServer(function(socket) {
	socket.pipe(socket);

	socket.on('data', function(data) {
		receiveData(data.toString(), socket);
	});
});

var receiveData = function(data, socket) {
	console.log(data);
	if (data.startsWith("HELLO")) {
		var id = data.substring("HELLO:".length).trim();
		var idNumber = parseInt(id);
		// This is a connection message.
		// Run the server
		addRobotByID(idNumber, socket);
		// If the processing has started, then call route robot
		// Otherwise it will be started when the server starts.
		if (processor.hasStartedProcessing()) {
			processor.routeRobot(idNumber);
		}
	} else if (data.startsWith("DONE")) {
		var id = data.substring("DONE:".length).trim();
		var idNumber = parseInt(id);

		var robot = getRobotByID(idNumber);
		if (robot.nextMove) {
			robot.nextMove();
		} else {
			// No queued moves, ask for new moves from the server
			processor.routeRobot(idNumber);
		}
	} else if (data.startsWith("INTENSITY")) {
		var intensities = data.substring("INTENSITY:".length).trim();
		var contents = intensities.split(";");

		var id = parseInt(contents[0]);

		// Parse the intensities into  a list and then
		// return them to the processor.
		var parsedData = [];
		for (var i = 1; i < contents.length; i ++) {
			// String is in the format (X, Y, Intensity)
			var string = contents[i].trim();
			// Remove the ( ):
			var data = string.substring(1, string.length - 2);
			// Now split these out with commans:
			var values = data.split(",");
			var x = parseInt(values[0]);
			var y = parseInt(values[1]);
			var intensity = parseInt(values[2]);
			parsedData.push({x:x, y:y, lightIntensity: intensity});
		}

		processor.setTiles(id, parsedData);
	} else {
		console.log(data + " unknown message");
		throw err; // Unknown data type
	}
};



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

var getRobotIndex = function(robotID) {
	for(var i = 0; i < robots.length; i ++) {
		if (robotID === robots[i].id) {
			return i;
		}
	}

	return null;
};

var getRobotByID = function(robotID) {
	var index = getRobotIndex(robotID);

	if (index === null) { return null;
	} else {
		return robots[index];
	}
}

// Idea is to return the socket of a particular
// robot in the system. Returns null
// if the robot is not found.
var getSocketByID = function(robotID) {
	var robot = getRobotByID(robotID);

	if (robot !== null) {
		return robot.socket;
	} else {
		return null
	}
};

// Returns a list of the IDs of the
// connected robots.
var getConnectedRobots = function() {
	var connections = [];

	for (var i = 0; i < robots.length; i++) {
		if (!robots[i].destroyed) {
			connections.push(robots[i].id);
		}
	}

	return connections;
};

server.listen(8000, '127.0.0.1');

var processor = require('./processing');

/* Messages to Robot */
var resume = function(robotID) {
	var socket = getSocketByID(robotID);

	// todo -- actually send a resume message
	if (socket !== null && !socket.destroyed) {
		socket.write('RESUME');
	}
};

var stop = function(robotID) {
	// Stop a robot from moving
	var socket = getSocketByID(robotID);

	// todo -- actually send a resume message
	if (socket !== null && !socket.destroyed) {
		socket.write('STOP');
	}
};

var stopAll = function() {
	// Stop all robots from moving
	// Send a stop message to all connected
	for (var i = 0; i < robots.length; i ++) {
		// todo, check if socket is open and stop it.
		if (!robots[i].socket.destroyed) {
			console.log(robots[i]);
			robots[i].socket.write('STOP')
		}
	}
};


var addPadding = function(number, length) {
	var formatted = '' + number;
	while (formatted.length < length) {
		formatted = '0' + formatted;
	}
	return formatted;
}


var move = function(robotID, degree, distance) {
	// turn robot degree radians clockwise
	// degree in RADIANS

	console.log("DEGREE: " + degree);
	// TODO -- move the robot
	var socket = getSocketByID(robotID);
	// At speed 0.5, it does 46 - 48 cm per second
	// Degrees conversion rate is at 0.5 speed, 5.5 seconds for 360 degrees.
	distance = distance * 10; // convert distances to mm
	degree = degree * 180 / Math.PI;

	var speed = 470; // fixed at 470mm per second
	var durationStraight = distance/speed * 1000; // milliseconds 0001 - 9999
	var durationRotate;
	var direction; // directions forward, back, left, right.
	if (degree == 0) {
		direction = "forward";
	} else if (degree == 180) {
		direction = "backward";
	} else if (degree < 180) { // turn left
		direction = 'left';
		durationRotate = degree/180 * 2250; // 2.25 seconds for 180 degrees of rotation
	} else { // turn right
		direction = 'right'
		degree = 360 - degree;
		durationRotate = degree/180 * 2250 ;
	}
	//convert durations to have leading 0s and be 4 digits long
	durationStraight = addPadding(durationStraight, 4);

	// speed is set to 5000 to be half the power
	var robotIndex = getRobotIndex(robotID);
	if (durationRotate != null) {
  	durationRotate = addPadding(durationRotate, 4);
		socket.write('direction = ' + direction + ', speed = 5000, duration = ' + durationRotate);
		console.log('id ' + robotID.toString() + ' Direction:' + direction
			+ ' Duration: ' + durationRotate);
		robots[robotIndex].nextMove = function() {
			socket.write('direction = ' + direction + ', speed = 5000, duration = ' + durationStraight);
		}
	} else {
		socket.write('direction = ' + direction + ', speed = 5000, duration = ' + durationStraight);
		robots[robotIndex].nextMove = null;
	}
};

exports.resume = resume;
exports.stop = stop;
exports.stopAll = stopAll;
exports.move = move;
exports.getConnectedRobots = getConnectedRobots;

if (TEST) {
	exports.TEST = TEST;
	exports.addRobotByID = addRobotByID;
	exports.getSocketByID = getSocketByID;
	exports.getConnectedRobots = getConnectedRobots;
	exports.robots = robots;
	exports.receiveData = receiveData;
}
