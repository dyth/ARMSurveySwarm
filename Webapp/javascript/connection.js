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
	for (var i = 0; i < tiles.length; i ++) {
		for (var y = tiles[i].length; y < data.yDim; y ++) {
			tiles[i].push(DEFAULT_TILE_CONTENTS);
		}
	}
	// This is done in this way because we need to preseve
	// any old data in the loop.
	for (var i = tiles.length; i < xDim; i ++) {
		var newArray = new Array(data.yDim);

		for (var y = 0; y < newArray.length; y ++) {
			newArray[i] = DEFAULT_TILE_CONTENTS;
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
};

var socketTileUpdate = function(data) {
	// Here, update the tiles list.
    console.log("New Tile Data " + data.x + " " + data.y + " " + data.value);

	tiles[data.x][data.y] = data.value;

	updateCanvas();
};

var socket = io('localhost');

socket.on('sendRobotStatus', socketReceiveStatus);
socket.on('sendAreaDimensions', socketUpdateArea);
socket.on('sendTileUpdate', socketTileUpdate);

// This should be called to stop a robot
// with ID 'robotID'
var stop = function(robotID) {
	socket.emit('stop', {id: robotID});
}

var stopAll = function () {
	console.log("Stopping Robots");
	socket.emit('stopAll');
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
