/*
*
* connection.js
* Handles communication with the server.
*
 */

// Need to have the socket.io
// file loaded.

// moved this outside the socket call for testing
// This is called when the server says that the
// area was updated.
var socketUpdateArea = function(data) {
	// Create a new zeroed array for the tiles.
	// This will probably need to be changed once we stop
	// inputting the dimensions of the surface.
    console.log("New Area Dimensions " + data.xDim + " " + data.yDim);

	// Add to the end of each array until it is the
	// right length without
	// deleting data already in the array.
	var innerLength = 0;
	for (var i = 0; i < tiles.length; i ++) {
		for (var y = tiles[i].length; y < data.yDim; y ++) {
			tiles[i].push(0);
		}

		// Do this to keep track of the length
		// of the sub arrays. We need to use the max
		// of yDim and this value to actually do this.
		innerLength = tiles[i].length;
	}

	// Again, need to use the max length. Consider
	// getting an update with: (x = 10, y = 10)
	// then an update with (x = 11, y = 5). Need
	// to make the last row of length 10 to keep it
	// consistent (we are assuming a square surface).
	var newYDim = Math.max(data.yDim, innerLength);

	// This is done in this way because we need to preseve
	// any old data in the loop.
	console.log(newYDim);
	for (var i = tiles.length; i < data.xDim; i ++) {
		var newArray = [];

		for (var y = 0; y < newYDim; y ++) {
			newArray.push(1);
		}

		tiles.push(newArray);
	}

	updateCanvas();
}

var socketReceiveStatus = function(data) {
	// Get the robot that this is talking about.
	// Then, update the status of that robot.
	robots[data.id].status = data.status;
	robots[data.id].x = data.x;
	robots[data.id].y = data.y;

	updateState(data.id);
	updateRobotPosition(data.id);
	updateRobotInfo();
	updateCanvas();
};

var socketTileUpdate = function(data) {
	// Here, update the tiles list.
    //console.log("New Tile Data " + data.x + " " + data.y + " " + data.value);

	if (data.x >= tiles.length || data.y >= tiles.length) {
		socketUpdateArea({xDim: data.x + 1, yDim: data.y + 1});
	}

	tiles[data.x][data.y] = data.value;

	updateCanvas();
};

var socket = io('localhost');

socket.on('sendRobotStatus', socketReceiveStatus);
socket.on('sendAreaDimensions', socketUpdateArea);
socket.on('sendTileData', socketTileUpdate);

// This should be called to stop a robot
// with ID 'robotID'
var stop = function(robotID) {
	socket.emit('stop', {id: robotID});
	console.log("Stopping " + robotID);
}

var stopAll = function () {
	console.log("Stopping Robots");
	socket.emit('stopAll');
}

// This should be called to resume a robot
// with ID 'robotID'
var resume = function(robotID) {
	socket.emit('resume', {id: robotID});
	console.log("Resuming " + robotID);
}

// This should be called to send the tile size to the server.
var sendTileSize = function(size) {
	socket.emit('sendTileDimensions', size);
}
