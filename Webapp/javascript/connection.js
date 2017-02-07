// Need to have the socket.io 
// file loaded.

var socket = io('localhost');

// Fill the robots array with some default values before
// anything is received. Could alternatively talk to
// server on connect to get this information.
var robots =(function() {
	var size = 5;
	var robots = [];

	for (var i = 0; i < size; i ++) {
		robots.push({id: i, status: 'disconnected'});
	}

	return robots;
})();

var tiles = [];

var getRobotByID = function(id) {
	for (var i = 0; i < robots.length; i ++) {
		if (robots[i].id === id) {
			return robots[i];
		}
	}

	throw "Unknown robot " + id.toString();
};

var setRobotByID = function(robot, id) {
	for (var i = 0; i < robots.length; i ++) {
		if (robots[i].id === id) {
			robots[i] = robot;
			return;
		}
	}

	throw "Unknown robot " + id.toString();
};
	
socket.on('sendRobotStatus', function(data) {
	// Get the robot that this is talking about.
	// Then, update the status of that robot.
	var robot = getRobotByID(data.id);
	robot.status = data.status;
	robot.position = data.position;
	setRobotByID(robot, data.id);
});

socket.on('sendRobotPosition', function(data) {
	// Idea is to update the positions 
	for (var i = 0; i < data.robots.length; i ++) {
		var id = data.robots[i].id;
		var robot = getRobotByID(id);
		robot.position = data.robots[i].currentPosition;
		setRobotByID(robot, id);
	}

	// TODO -- Call an update funciton to let the position of
	// the robot update.
});

socket.on('sendAreaDimensions', function(data) {
	alert('area dimensions received!');
	// Create a new zeroed array for the tiles. 
	// This will probably need to be changed once we stop
	// inputting the dimensions of the surface.
	tiles = new Array(data.xDim);
	for (var i = 0; i < data.xDim; i ++) {
		tiles[i] = new Array(data.yDim);
	}

	alert('success');

	updateCanvas();
});

socket.on('sendTileUpdate', function(data) {
	// Here, update the tiles list.
	tiles[data.x][data.y] = data.value;

	updateCanvas();
});

// This should be called to stop a robot
// with ID 'robotID'
var stop = function(robotID) {
	socket.emit('stop', {id: robotID});
}

// This should be called to resume a robot 
// with ID 'robotID'
var resume = function(robotID) {
	socket.emit('resume', {id: robotID});
}

// This should be called to send the tile size to the server.
var sendTileSize = function(size) {
	socket.emit('sendTileDimensions', size);
}
