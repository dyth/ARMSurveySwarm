var TEST = true;

net = require('net');
processor = require('./processing');

var robots = [];

var server = net.createServer(function(socket) {

	socket.on('data', function(data) {
		// Pass the data on to receive data.
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

		console.log('Data received ' + data);

		receiveData(jsonData, socket);

	});

	socket.on('error', function(error) {
		if (socket.robotID) {
			// If the robot ID was put in the socket, then
			// we can use this to trigger an error message. Otherwise
			// the robot didn't get to the HELLO stage
			processor.robotConnectionLost(socket.robotID);
			console.log("Lost ID: " + socket.robotID);
		}

		console.log('Connection abruptly terminated');
		console.log(error);

	});
});

/*
* Called when the server is sent data
*/
var receiveData = function(data, socket) {

	if(data.type === 'HELLO'){

		console.log("Robot " + data.id + " connected.")

		// Extract the robot id
		var robotID = data.id;

		// Add the robot socket
		robots[robotID] = socket;

		// Add the robot ID to the socket
		socket.robotID = robotID;

		// Add the robot to the processor
		processor.addRobotToList(robotID);

	} else if(data.type === 'DONE'){

		// Extract the robot id
		var robotID = socket.robotID;

		if (robots[robotID] === undefined) {
			// There was an error getting that out.
			console.log("ERROR(receiveData/communication.js): Unknown ID " +
				socket.robotID);
			return;
		}

		// Send the intensity data to processing
		processor.setTiles(robotID, data.intensities);
		processor.nextMove(robotID);

	} else {
		console.log("ERROR(receiveData/communication.js): Unknown Message");
	}

};

/*
* Sends the start message to a robot.
* Called in processing.js
*/
var sendStart = function(robotID, tileSize) {

	// Get the socket and send
	var socket = robots[robotID];
	if(socket === null){
		console.log("ERROR(sendStart/communication.js): Null Socket");
		return;
	}

	if (socket === undefined) {
		// This will happen if there was a robot with a lower
		// ID than has connected started.
		return;
	}

	socket.write(JSON.stringify({type: "START", tileSize: tileSize}));

};

/*
* Sends the stop message to a robot.
*/
var sendStop = function(robotID) {

	// Get the socket and send
	var socket = robots[robotID];

	if (socket === undefined) {
		// This will happen if there was a robot with a lower
		// ID than has connected started.
		return;
	}

	if (socket === null || socket.write === undefined) {
		console.log("ERROR(sendStop/communication.js): Null Socket");
		return;
	}
	socket.write(JSON.stringify({type: "STOP"}));

};

/*
* Sends a move message to a robot
 */
var sendMove = function(robotID, angle, distanceMM) {

	// Convert angle to degrees
	var degrees = angle * 180.0 / Math.PI;

	// Get the socket and sends
	var socket = robots[robotID];

	if (socket === undefined) {
		// This will happen if there was a robot with a lower
		// ID than has connected started.
		return;
	}

	if(socket === null || socket.write === undefined){
		console.log("ERROR(sendMove/communication.js): Null Socket");
		return;
	}

	// toFixed converts the floating point numbers into fixed point
	// representations of themselves.
	socket.write(JSON.stringify({ type: 'MOVE',
			angle: parseInt(Math.round(degrees)),
			distance: parseInt(Math.round(distanceMM))}));
};


server.listen(9000);

exports.sendStart = sendStart;
exports.sendStop = sendStop;
exports.sendMove = sendMove;

if (TEST) {
	exports.TEST = TEST;
	exports.robots = robots;
	exports.receiveData = receiveData;
}
