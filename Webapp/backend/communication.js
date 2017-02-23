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
		// TODO -- Go till the end of message signal
		// and pass that. Then save the rest for later.
		receiveData(data.toString(), socket);
	});
});

var receiveData = function(data, socket) {
	if (data.substring(0, "HELLO:".length) === ("HELLO:")) {
		var id = data.substring("HELLO:".length).trim();
		var idNumber = stringToNumber(id);

		if (idNumber === null) {
			return;
		}

		console.log("NUMBER" + idNumber);
		// This is a connection message.
		// Run the server
		addRobotByID(idNumber, socket);
		// If the processing has started, then call route robot
		// Otherwise it will be started when the server starts.
		if (processor.hasStartedProcessing()) {
			processor.routeRobot(idNumber);
		}
	} else if (data.substring(0, "DONE:".length) === "DONE:") {
		var id = data.substring("DONE:".length).trim();
		var idNumber = stringToNumber(id);
		if (idNumber === null) {
			return;
		}

		var robot = getRobotByID(idNumber);
		if (robot === null) {
			console.log("NON-FATAL ERROR ------------------------------");
			console.log("Unknown ID " + idNumber);
		}
		if (robot.nextMove) {
			var robotMove = robot.nextMove;
			robot.nextMove = null;
			robotMove();
		} else {
			// No queued moves, ask for new moves from the server
			processor.routeRobot(idNumber);
		}
	} else if (data.substring(0, "INTENSITY:".length) === "INTENSITY:") {
		var intensities = data.substring("INTENSITY:".length).trim();
		var contents = intensities.split(";");

		var id = stringToNumber(contents[0]);
		if (id === null) {
			return;
		}

		// Parse the intensities into  a list and then
		// return them to the processor.
		var parsedData = [];
		for (var i = 1; i < contents.length; i ++) {
			// String is in the format (X, Y, Intensity)
			var string = contents[i].trim();
			// Need to do a lot of verification here because
			// the server should really not crash
			if (string.length < 2) {
				console.log("NON-FATAL ERROR ------------------------------");
				console.log("Values: " + string + " not long enough");
				return;
			}
			// Remove the ( ):
			var data = string.substring(1, string.length - 1);
			// Now split these out with commans:
			var values = data.split(",");
			if (values.length !== 3) {
				console.log("NON-FATAL ERROR ------------------------------");
				console.log("Expected 3 values, actually got: " + values.length);
				console.log("Values are: " + values);
				return;
			}

			var x = stringToNumber(values[0]);
			var y = stringToNumber(values[1]);
			var intensity = stringToNumber(values[2]);

			if (x === null || y === null || intensity === null) {
				return;
			}

			parsedData.push({x:x, y:y, lightIntensity: intensity});
		}

		processor.setTiles(id, parsedData);
	} else {
		console.log("NON-FATAL ERROR ------------------------------------");
		console.log("unknown message " + data);
	}
};

var stringToNumber = function(string) {
	if (isNaN(string)) {
		// ID isn't a number. Print an error and return
		console.log("NON-FATAL ERROR ------------------------------");
		console.log("ID: " + string + " is not a number");
		return null;
	}

	var idNumber = Number(string);

	if (idNumber < 0 || idNumber > 100000) {
		console.log("NON-FATAL ERROR ------------------------------");
		console.log("Number " + idNumber + " is too big or too small");
		console.log("Try a number under 100,000 and over 0");
		return null;
	}

	if (idNumber % 1 !== 0) {
		// This is a floating point number
		console.log("NON-FATAL ERROR ------------------------------");
		console.log("Number " + idNumber + " should not be floating point");
		return null;
	}

	return idNumber;
}



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
		socket.write('RESUME\n');
	}
};

var stop = function(robotID) {
	// Stop a robot from moving
	var socket = getSocketByID(robotID);

	// todo -- actually send a resume message
	if (socket !== null && !socket.destroyed) {
		socket.write('STOP\n');
	}
};

var stopAll = function() {
	// Stop all robots from moving
	// Send a stop message to all connected
	for (var i = 0; i < robots.length; i ++) {
		// todo, check if socket is open and stop it.
		if (!robots[i].socket.destroyed) {
			console.log(robots[i]);
			robots[i].socket.write('STOP\n')
		}
	}
};


var addPadding = function(number, length) {
	number = Math.round(number);

	var negative = false;

	// deal with the negative number case
	if (number < 0) {
		number = - number
		length -= 1;
		negative = true;
	}

	var formatted = '' + number;
	while (formatted.length < length) {
		formatted = '0' + formatted;
	}

	if (negative) {
		formatted = '-' + formatted;
	}
	return formatted;
}


var move = function(robotID, degree, distance) {
	// turn robot degree radians clockwise
	// degree in RADIANS

	// console.log("DEGREE: " + degree);
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
		// 2.25 seconds for 180 degrees of rotation
		durationRotate = degree/180 * 2250; 
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
		// Send the current message to the robot.
		socket.write('direction = ' + direction +
			', speed = 5000, duration = ' + durationRotate);

		console.log('id ' + robotID.toString() + ' Direction:' + direction
			+ ' Duration: ' + durationRotate);

		// Add the callback for the next instruction
		robots[robotIndex].nextMove = function() {
			socket.write('direction = ' + direction +
				', speed = 5000, duration = ' + durationStraight);
		}
	} else {
		socket.write('direction = ' + direction +
			', speed = 5000, duration = ' + durationStraight);
		// This is just a straight movement so just
		// there is no next move.
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
	exports.addPadding = addPadding;
}
