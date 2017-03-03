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
*/
// NOTE -- Unlike the rest of the application,
// this array is not indexed by ID.
var robots = [];


var TEST = true;

// This stores the number of robots currently connected
var connectedRobots = 0;
// This stores the number of robots currently done processing.
var robotsDone = 0;

net = require('net');
processor = require('./processing');

var server = net.createServer(function(socket) {
	var accumulatedData = "";

	socket.on('data', function(data) {
		// Pass the data on to receive data.
		console.log(data);
		var jsonData;

		try {
			jsonData = JSON.parse(data);
		} catch(err) {
			console.log('NON-FATAL ERROR ---------------------------');
			console.log('Unexpected data: ' + data);
			console.log(err);
			console.log('Data should be formatted as a JSON string');
			return;
		}

		receiveData(JSON.parse(data), socket);
	});

	socket.on('error', function(error) {
		if (socket.robotID) {
			// If the robot ID was put in the socket, then
			// we can use this to trigger an error message. Otherwise
			// the robot didn't get to the HELLO stage
			processor.robotConnectionLost(socket.robotID);
			console.log("Lost ID: " + socket.robotID);
		}

		connectedRobots --;

		console.log('Connection abruptly terminated');
		console.log(error);
	});
});

server.listen(9000);

var receiveData = function(data, socket) {
	console.log(data);
	if (data.type === 'HELLO') {
		if (data.id === undefined) {
			console.log('NON-FATAL ERROR -----------------------------');
			console.log('Expected Robot ID to be set as \'id\' field in data');
			return;
		}
		// This is a connection message.
		// Run the server
		addRobotByID(data.id, socket);
		// Also set the robotID in the socket
		socket.robotID = data.id;

		connectedRobots ++;

		if (!processor.hasStartedProcessing()) {
			// In this case, the server has not started
			// processing. So return, because the robots
			// need the tile size information to start moving.
			// They will be started the communication.startRobots()
			// function.
			return;
		}

		if (robotsDone === connectedRobots - 1) {
			// Here we are saying if the robots that are
			// connected before this one (hence the -1)
			// have already finished their moves, then this robot
			// is good to go too.
			console.log('AHHH YOU FOUND A CONCURRENCY PROBLEM. IF THIS '
				+ ' HAPPENS REGULARLY SEE YOUR GP IMMEDIATELY');
		} else {
			// otherwise, there are still robots moving. This robot
			// will be routed at the end of their moves.
			// I expect this case in all except the pathalogical case

			sendInstructions();
		}
	}
	else if (data.type === "DONE") {

		var robotID = socket.robotID;

		var robot = getRobotByID(robotID);
		if (robot === null) {
			console.log("NON-FATAL ERROR ------------------------------");
			console.log("Unknown ID " + data.id);
			return;
		}

		// Deal with the tile intensities
		processor.setTiles(robotID, data.intensities);

		// Increment the number  of robots done.
		robotsDone ++;
		if (robotsDone === connectedRobots) {
			// No queued moves, ask for new moves from the server
			console.log("sending new commands");
			sendInstructions();

		} else {
			console.log('robots done = ' + robotsDone + ', robots ' +
				' connected = ' + connectedRobots);
		}
	}
	else {
		console.log("NON-FATAL ERROR ------------------------------------");
		console.log("unknown message " + data);
	}
};

var sendInstructions = function() {
	if (robotsDone !== connectedRobots) {
		console.log("NON-FATAL ERROR -------------------------------------");
		console.log("Expected all robots to be at corners. Found none");
		return;
	}

	if (!processor.hasStartedProcessing()) {
		console.log("NON-FATAL ERROR -------------------------------------");
		console.log("Expected processor to have started running");
		return;
	}

	robotsDone = 0;

	for (var i = 0; i < robots.length; i ++) {
		if (!robots[i].destroyed) {
			// Start routing the robot.
			processor.routeRobot(robots[i].id);
		}
	}
}

var startRobots = function(tileSize) {
	// This function sends out the START messages to the robots.
	// These messages contain the tile size.
	for (var i = 0; i < robots.length; i ++) {
		var socket = getSocketByID(robots[i].id);
		socket.write(JSON.stringify({type: "START", tileSize: tileSize}));
	}

	// After that has been sent to each robot, start the movement:
	for (var i = 0; i < robots.length; i ++) {
		processor.routeRobot(robots[i].id);
	}
}

var addRobotByID = function(robotID, socket) {
	// Make sure there are enough robots on the processor:
	processor.addRobotsToList(robotID);
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

	if (index === null) {
		return null;
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

var stop = function(robotID) {
	// Stop a robot from moving
	var socket = getSocketByID(robotID);

	if (socket !== null && !socket.destroyed) {
		socket.write(JSON.stringify({type: "STOP"}));
	}
};

var wait = function(robotID) {
	// Pause a robot for 3 seconds
	var socket = getSocketByID(robotID);

	if (socket !== null && !socket.destroyed){
		socket.write(JSON.stringify({type: "WAIT", time: 3000}));
	}
};

var stopAll = function() {
	// Stop all robots from moving
	// Send a stop message to all connected
	for (var i = 0; i < robots.length; i ++) {
		// todo, check if socket is open and stop it.
		if (!robots[i].socket.destroyed) {
			robots[i].socket.write(JSON.stringify({type: "STOP"}));
		}
	}
};

/*
* Function sending instructions for movement to robots and
* receiving acknowledgements.
* - robotID is integer ID to send message to
* - angle is in degrees clockwise from where robot is facing
* - distance is distance in mm to destination tile
*/
var move = function(robotID, angle, distanceMM) {
	var socket = getSocketByID(robotID);
	var robotIndex = getRobotIndex(robotID);

	var degrees = angle * 180.0 / Math.PI;

	if (degrees === undefined || angle distanceMM === undefined) {
		console.log("NON-FATAL ERROR---------------------------");
		console.log("Some inputs are undefined, angle = " + degrees + 
			", distance = " + distanceMM);
		return;
	}

	if (socket === null) {
		console.log("NON-FATAL ERROR-------------------------");
		console.log("unexpected ID " + robotID);
		return;
	}

	socket.write(JSON.stringify({ type: 'MOVE',
			angle: degrees,
			distance: distanceMM}));
};

exports.stop = stop;
exports.stopAll = stopAll;
exports.move = move;
exports.wait = wait;
exports.getConnectedRobots = getConnectedRobots;

if (TEST) {
	exports.TEST = TEST;
	exports.addRobotByID = addRobotByID;
	exports.getSocketByID = getSocketByID;
	exports.getConnectedRobots = getConnectedRobots;
	exports.robots = robots;
	exports.receiveData = receiveData;
	exports.getRobotIndex = getRobotIndex;
	exports.getRobotByID = getRobotByID;
	exports.startRobots = startRobots;
}
