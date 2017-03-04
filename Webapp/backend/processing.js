/**
 * Backend to deal with messages from robots
 * deal with representation of floor pattern.
 *
 * light intensity: 0 = black, 1 = white.
 *
 */


// Call server.updateStatus(robotID, xPosition, yPosition, status)
// server.updateGrid(x, y), updates the size of the grid.
// server.updateTile(x, y, value) updates a tile.
var server = require('./server');
var communication = require('./communication');
var route = require('./route');

var TEST = true;

var processingTiles = [];

// Array order is by robot ID.
// For the status, it is an index in the array  'states' in state.js
// on the frontend:

// Waiting: 0, Scanning:  1, Stopped: 2
var robots = [];

// height and width in the number of tiles, tileSize in mm
var width = 0;
var height = 0;
var tileSize = 0;

var tilesCovered = 0;
var totalTiles = 0;

var startedProcessing = false;

// State to coordinate robots
// A robot at the corner is a waiting robot
var connectedRobots = 0;
var waitingRobots = 0;

/*
 * Create new tilesList
 *
 * Does not delete any contents of the list
 * if they are already defined.
 */
var createTilesList = function() {
	totalTiles = width * height;

	// Increases the number of tiles up to the width and height.
	for(var i = processingTiles.length; i < width; i++){
		var columns = [];

		if (i < processingTiles.length) {
			// There are already tiles here.
			// We don't want to lose information on them.
			columns = processingTiles[i];
		}

		for(var j = columns.length; j < height; j++) {
			// This pushes the initial tile state. Accepted
			// is the color that we currently take to be the value
			// and black and white are counts of the measurements
			// for each one.
			columns.push({accepted: 1, black: 0, white: 0});
		}

		if (i < processingTiles.length) {
			processingTiles[i] = columns;
		} else {
			processingTiles.push(columns);
		}
	}
}

/*
* Adds a robot to the list
* Called in communication.js
 */
var addRobotToList = function(robotID) {
	// Quadrants are numbered 0 - 3 starting from the bottom left-hand corner
	// xCorner/yCorner will be out of bounds of the tiles array since we will not
	// always be in the bottom left hand corner now
	robots[robotID] = {xCorner: 0, yCorner: 0,
		xAfter: 0, yAfter: 0, quadrant: 0, robotStatus: 2};

	connectedRobots++;
}

/*
 * Function to round position to correspond to bottom left corner of tile.
 * Gets position in tiles list.
 */
var roundPosition = function(pos) {
	pos = pos / tileSize;
	if (pos < 0) {
		return 0;
	} else if (pos > height) {
		return height;
	} else  {
		return Math.floor(pos + 0.1);
	}
}

var setRobotStatusStopped = function(robotID) {
	robots[robotID].robotStatus = 2;

	sendStatusUpdate(robotID);
}

var setRobotStatusScanning = function(robotID) {
	robots[robotID].robotStatus = 1;

	sendStatusUpdate(robotID);
};

var setRobotStatusWaiting = function(robotID) {
	robots[robotID].robotStatus = 0;

	sendStatusUpdate(robotID);
}

var robotConnectionLost = function(robotID) {
	// Set the robot status to calibrating again.
	console.log("CONNECTION LOST");
	robots[robotID].robotStatus = 2;

	sendStatusUpdate(robotID);

	// Decrease the connected robots
	connectedRobots--;
};

/*
 * Register communication of tile colour received from robots.
 *
 * Tiles is just a list of intensities. We use the robot start
 * and ending positiong to interpolate the locations of the intensities.
 */
var setTiles = function(robotID, intensities) {
	var robot = robots[robotID];

	console.log("DATA: " + intensities);

	// Update tile table for current position
	// Get x, y, light intensity, add to processing tiles
	var coordX = robot.xCorner;
	var coordY = robot.yCorner;
	var delta = Math.pow(Math.pow(robot.xCorner - robot.xAfter, 2) +
		Math.pow(robot.yCorner - robot.yAfter, 2), 0.5) / intensities.length;
	var angle = Math.atan((robot.yAfter - robot.yCorner) / (robot.xAfter - robot.xCorner)); //TODO: (0,_) error

	for (var i = 0; i < intensities.length; i++) {
		var thisIntensity = intensities[i];

		var roundedX = roundPosition(coordX);
		var roundedY = roundPosition(coordY);

		if (roundedX > processingTiles.length - 1 ||
			roundedY > processingTiles[roundedX].length - 1) {
			console.log("NON FATAL ERROR -------------------------------");
			console.log("robot off grid");
			return;
		}

		if (thisIntensity === 0) {
			// Intensity is black
			processingTiles[roundedX][roundedY].black ++;
		} else {
			// Intensity is white
			processingTiles[roundedX][roundedY].white ++;
		}

		// This updates the accepted value for the tile and sends
		// it on to the server.
		tileUpdate(roundedX, roundedY);

		//  Now, update the coordinates
		coordX += delta * Math.cos(angle);
		coordY += delta * Math.sin(angle);
	}

	// Update the robot start position
	robot.quadrant = (robot.quadrant + 1) % 4
	var nextCorner = getNextCorner(robot.quadrant);

	robot.xCorner = nextCorner.x;
	robot.yCorner = nextCorner.y;

}

var getNextCorner = function(quadrantNo) {
	switch (quadrantNo) {
		case 0:
			return {orientation: Math.PI/2, x: 0, y: 0};
		case 1:
			return {orientation: 0, x: 0, y: height - 1};
		case 2:
			return {orientation: -Math.PI/2, x: height - 1, y: height - 1};
		case 3:
			return {orientation: Math.PI, x: height - 1, y: 0};
	}
}

/*
* Called when a robot reaches the next corner and sends back a list of intensities
 */
var nextMove = function (robotID) {

	// The robot is now waiting
	waitingRobots++;

	if(waitingRobots === connectedRobots){

		// Give each robot a new instruction
		for(var id = 0; id<robots.length; id++){

			// Get the robot
			var robot = robots[id];

			// Calculate the next move
			var next = route.move(robot.x, robot.y);


			if(next.stopAll){
				// Stop the robot
				communication.sendStop(id);

				// Set the robot status to stopped
				setRobotStatusStopped(id);

			} else {

				// Convert coordinates into angles and distances
				var robotInstructions = convert(id, next.xAfter, next.yAfter);

				// Update the robot destination
				robot.xAfter = next.xAfter;
				robot.yAfter = next.yAfter;

				// Send the instruction
				communication.sendMove(id, robotInstructions.angle, robotInstructions.distance);

				//And set the robot status to moving
				setRobotStatusScanning(robotID);

			}

		}

		waitingRobots = 0;

	} else {
		setRobotStatusWaiting(robotID);
	}

};

/*
 * This updates the accepted tile value as appropriate
 */
var tileUpdate = function(coordX, coordY){
	var tiles = processingTiles[coordX][coordY];

	// Recalculate the processing accepted value.
	// This sets the default value
	// The >= value means that white is the default
	if (tiles.white >= tiles.black) {
		tiles.accepted = 1;
	} else {
		tiles.accepted = 0;
	}

	server.updateTile(coordX, coordY, tiles);
};

var vectorLength = function(vector) {
	return Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2)) * tileSize;
};

/*
 * This takes the next position of the robots.
 *
 * It returns a dictionary of the distance and the angle through
 * which the robot will rotate.
 *
 */
var convert = function(robotID, tileX, tileY){
	var robot = robots[robotID];

	// Prev always stores starting corner, we interpolate between this and
	// tileX, tile Y. After checkTile returns, robots will store the new corner
	// as prev but the tile just travelled to in after.
	var cornerX = robot.xCorner;
	var cornerY = robot.yCorner;

	// [opp, adj]
	var changeInX = Math.abs(tileX - cornerX);
	var changeInY = Math.abs(tileY - cornerY);

	var opp;
	var adj;

	// if quadrant number is even, opp is change in x, adj is change in y
	if (robots[robotID].quadrant % 2 === 0) {
		opp = changeInX;
		adj = changeInY;
	} else {
		opp = changeInY;
		adj = changeInX;
	}

	var angle = Math.atan(opp/adj); // opp/adj
	var distance = vectorLength([changeInX, changeInY]);

	console.log('From x=' + cornerX + ' y='+ cornerY
	+ ' going to x=' + tileX +' y=' + tileY + ' with angle ' + angle*180/Math.PI + ' and distance ' + distance);

	return {angle: angle, distance: distance}
};

/*
 * This unpacks the dictionary for the robot status and sends it on to the
 * server
 */
var sendStatusUpdate = function(robotID) {
	var robot = robots[robotID];
	server.updateStatus(robotID, robot.xAfter, robot.yAfter, robot.robotStatus);
};

/*
 * Command from user to stop the traversal of one robot
 */
var stop = function(robotID) {
	robots[robotID].robotStatus = 2;
	sendStatusUpdate(robotID);
	communication.sendStop(robotID);
};

/*
 * Command from user to stop the traversal of all robots
 */
var stopAll = function() {
	console.log(robots);
	for (var i = 0; i < robots.length; i ++) {
		robots[i].robotStatus = 2;
		sendStatusUpdate(i);
		communication.sendStop(i);
	};
};

/*
 * Set user input of tile size
 */
var setTileSize = function(size) {
	tileSize = size;
};

var setGridDimensions = function(sizes) {
	width = sizes.x;
	height = sizes.y;
	createTilesList();
};

var getGridDimensions = function() {
	return {x: width, y: height};
};

var startProcessing = function() {
	startedProcessing = true;
	route.setUp(width); // set up uncheckedTiles lists
	console.log('robots length ' + robots.length);

	for (var i = 0; i < robots.length; i ++) {
		// This sends the start message to the robots.
		if (robots[i] != undefined) {

			communication.sendStart(i, tileSize);

			nextMove(i);
		}
	}
};

exports.setTileSize = setTileSize;
exports.setGridDimensions = setGridDimensions;
exports.getGridDimensions = getGridDimensions;
exports.addRobotToList = addRobotToList;
exports.stop = stop;
exports.stopAll = stopAll;
exports.setTiles = setTiles;
exports.startProcessing = startProcessing;
exports.nextMove = nextMove;
exports.robotConnectionLost = robotConnectionLost;


/*
 * Unit testing
 * Module exports added for testing
 */
if (TEST) {
	exports.createTilesList = createTilesList;
	exports.processingTiles = processingTiles;
	exports.robots = robots;
	exports.width = width;
	exports.height = height;
	exports.tilesCovered = tilesCovered;
	exports.totalTiles = totalTiles;

	exports.roundPosition = roundPosition;
	exports.vectorLength = vectorLength;

	var setCoveredToTotalTiles = function() {
		tilesCovered = totalTiles;
	}
	exports.setCoveredToTotalTiles = setCoveredToTotalTiles;
}
