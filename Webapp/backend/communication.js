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

/*
* List of robot dictionaries containing following attributes:
* robotID
* socket
* nextMove
*/
// NOTE -- Unlike the rest of the application,
// this array is not indexed by ID.
var robots = [];


var TEST = true;

net = require('net');
processor = require('./processing');

var server = net.createServer(function(socket) {
	var accumulatedData = "";

	socket.on('data', function(data) {
		// Search the incoming data for the end of line
		// character.
		accumulatedData += data.toString();

		var messages = accumulatedData.split('\n');
		if (messages.length === 1) {
			// No \n found yet
			accumulatedData = messages[0];
		} else {
			// There have been messages received!
			for (var i = 0; i < messages.length - 1; i ++) {
				receiveData(messages[i], socket);
			}
			accumulatedData = messages[messages.length - 1];
		}
	});

	socket.on('error', function(error) {
		if (socket.robotID) {
			// If the robot ID was put in the socket, then
			// we can use this to trigger an error message. Otherwise
			// the robot didn't get to the HELLO:n stage.
			processing.robotConnectionLost(socket.robotID);
		}

		console.log('Connection abruptly terminated');
		console.log(error);
	});
});

server.listen(8000);

var receiveData = function(data, socket) {
	console.log(data);
	if (data.substring(0, "HELLO:".length) === ("HELLO:")) {
		var id = data.substring("HELLO:".length).trim();
		var idNumber = stringToNumber(id);

		if (idNumber === null) {
			return;
		}
		// This is a connection message.
		// Run the server
		addRobotByID(idNumber, socket);
		// Also set the robotID in the socket
		socket.robotID = idNumber;
		// If the processing has started, then tell the robot
		// to move down the ramp.
		// Otherwise it will be started when the server starts.
		enqueueRobot(idNumber);
		if (processor.hasStartedProcessing()) {
			// enqueue the robot and start it if needed
			startRobots();
		}
	} else if (data.substring(0, "RESET:".length) === "RESET:") {
		// Then reset the robot position and  move the robot
		var id = data.substring("RESET:".length).trim();
		var idNumber = stringToNumber(id);

		if (idNumber === null) {
			return;
		}

		processor.resetRobot(idNumber);
		processor.routeRobot(idNumber);
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
			return;
		}
		if (robot.nextMove) {
			var robotMove = robot.nextMove;
			robot.nextMove = null;
			robotMove(idNumber);
		} else {
			// No queued moves, ask for new moves from the server
			console.log("sending new commands");
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

			var x = stringToFloat(values[0]);
			var y = stringToFloat(values[1]);
			var intensity = stringToNumber(values[2]);

			if (x === null || y === null || intensity === null) {
				console.log("NON-FATAL ERROR ------------------------------");
				console.log("Expected 3 integers, got none");
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

var stringToFloat = function(string) {
	return stringToNumber(string, true);
}

var stringToNumber = function(string, isFloat) {
	if (isFloat === undefined) {
		isFloat = false;
	}

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

	if (!isFloat && idNumber % 1 !== 0) {
		// This is a floating point number
		console.log("NON-FATAL ERROR ------------------------------");
		console.log("Number " + idNumber + " should not be floating point");
		return null;
	}

	return idNumber;
}

/*
 * This keeps a list of robots to be started.
 * Upon addition of a robot, if the list is
 * empty, it starts it immediately.
 *
 * Once the robot is clear of the
 * ramp it starts routing.
 */
var startRobot_waitingRobots = []
var startRobot_running = false;
var startRobot_movementDone = null;
var enqueueRobot = function(robotID) {
	startRobot_waitingRobots.push(robotID);
}

/*
 * This starts all enqueued robots in the stack.
 */
var startRobots = function() {
	if (startRobot_running) {
		return;
	}
	console.log('start robot waiting ' + startRobot_waitingRobots.length)
	if (startRobot_waitingRobots.length === 0) {
		startRobot_running = false;
		startRobot_movementDone = null;
		return;
	}

	startRobot_running = true;

	var thisRobot = getSocketByID(startRobot_waitingRobots[0]);

	// Now, send that robot the message.
	thisRobot.write("START\n");
	// set the callback as appropriate:
	startRobot_movementDone = function(thisRobotID) {
		// remove from the head of the list
		startRobot_waitingRobots.shift();

		startRobot_running = false;
		startRobots();

		// need to send directions to this robot now that
		// it is off the ramp and the next robot has started
		// moving
		processor.routeRobot(thisRobotID);
	}
}

var addRobotByID = function(robotID, socket) {
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
	robots.push({id: robotID, socket: socket, nextMove: null});
};

var getRobotIndex = function(robotID) {
	if (robotID === undefined) {
		console.log("NON-FATAL ERROR--------------------------------");
		console.log("robot ID is undefined");
		return null;
	}

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
		return null;
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

var processor = require('./processing');

/* Messages to Robot */
var resume = function(robotID) {
	var socket = getSocketByID(robotID);

	if (socket !== null && !socket.destroyed) {
		socket.write('RESUME\n');
	}
};

var stop = function(robotID) {
	// Stop a robot from moving
	var socket = getSocketByID(robotID);

	if (socket !== null && !socket.destroyed) {
		socket.write('STOP\n');
	}
};

var wait = function(robotID) {
	// Pause a robot for 3 seconds
	var socket = getSocketByID(robotID);

	if (socket !== null && !socket.destroyed){
		socket.write('WAIT 03000\n');
	}
};

var stopAll = function() {
	// Stop all robots from moving
	// Send a stop message to all connected
	for (var i = 0; i < robots.length; i ++) {
		// todo, check if socket is open and stop it.
		if (!robots[i].socket.destroyed) {
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

/*
* Function sending instructions for movement to robots and
* receiving acknowledgements.
* - robotID is integer ID to send message to
* - degree in RADIANS as input where conversion rate is
*   at 0.5 speed, 5.93 seconds for 360 degrees.
* - distance is distance in cm to destination tile
*
* At speed 0.5, robot covers 460-480mm per second
* Directions forward, back, left, right
*/
var move = function(robotID, xPosCM, yPosCM, degree, distance) {
	var socket = getSocketByID(robotID);

	distance = distance * 10; // convert distances to mm
	degree = degree * 180 / Math.PI; // convert angle to degrees

	var speed = 48; // speed fixed at 480mm per second
	var durationStraight = distance/speed * 1000; // milliseconds 0001 - 9999
	var durationRotate;
	var direction;

	if (degree == 0) {
		direction = "forward";

	} else if (degree == 180) {
		direction = "backward";

	} else if (degree < 180) { // turn left
		direction = 'left';
		// 2.965 seconds for 180 degrees of rotation
		durationRotate = degree/180 * 2965;

	} else { // turn right
		direction = 'right'
		degree = 360 - degree;
		durationRotate = degree/180 * 2965 ;
	}

	//convert durations to have leading 0s and be 5 digits long
	durationStraight = addPadding(durationStraight, 5);

	console.log("SENDING DIRECTIONS");

	// speed is set to 5000 to be half the power
	var robotIndex = getRobotIndex(robotID);
	if (durationRotate != null) {

		durationRotate = addPadding(durationRotate, 5);
		// Send the current message to the robot.
		socket.write(direction + ", " + xPosCM + ', '
			+ yPosCM +
			', 5000, ' + durationRotate +
			'\n');

		// Add the callback for the next instruction
		robots[robotIndex].nextMove = function() {
			socket.write('forward, ' + xPosCM + ', ' + yPosCM +
				', 5000, ' + durationStraight +
				'\n');

			// If the robots are being started, then after the
			// linear morement is complete we have to send
			// the next one off the ramp. This triggers a
			// callback that deals with that.
			if (startRobot_movementDone) {
				startRobot_movementDone(robotID);
			}
		}
	} else {
		socket.write(direction + ', ' + xPosCM + ', ' + yPosCM +
			', 5000, ' + durationStraight +
			'\n');
		// This is just a straight movement so just
		// there is no next move.

		// If the robots are being started, then after the
		// linear morement is complete we have to send
		// the next one off the ramp. This triggers a
		// callback that deals with that.
		robots[robotIndex].nextMove = startRobot_movementDone;
	}
};

exports.resume = resume;
exports.stop = stop;
exports.stopAll = stopAll;
exports.move = move;
exports.wait = wait;
exports.getConnectedRobots = getConnectedRobots;
exports.startRobots = startRobots;

if (TEST) {
	exports.TEST = TEST;
	exports.addRobotByID = addRobotByID;
	exports.getSocketByID = getSocketByID;
	exports.getConnectedRobots = getConnectedRobots;
	exports.robots = robots;
	exports.receiveData = receiveData;
	exports.addPadding = addPadding;
	exports.getRobotIndex = getRobotIndex;
	exports.getRobotByID = getRobotByID;
	exports.startRobot_waitingRobots = startRobot_waitingRobots;
	exports.startRobot_running = startRobot_running;
	exports.startRobot_movementDone = startRobot_movementDone;
	exports.enqueueRobot = enqueueRobot;
}
