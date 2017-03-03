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
var initialTileState = [2];

// Array order is by robot ID.
// For the status, it is an index in the array  'states' in state.js
// on the frontend:

// Calibrating: 0, Scanning:  1, Stopped: 2, Disconnected: 3, Recalibrate: 4
var robots = [];

var width = 0;
var length = 0;
var tileSize = 0;

var tilesCovered = 0;
var totalTiles = 0;

var startedProcessing = false;

/*
 * Create new tilesList
 *
 * Does not delete any contents of the list
 * if they are already defined.
 */
var createTilesList = function() {
	totalTiles = width * length;

	// Increases the number of tiles up to the width and length.
	for(var i = processingTiles.length; i < width; i++){
		var columns = [];

		if (i < processingTiles.length) {
			// There are already tiles here.
			// We don't want to lose information on them.
			columns = processingTiles[i];
		}

		for(var j = columns.length; j < length; j++) {
			// initial tile state is a 2 element
			// list for first robot and final state
			columns.push(initialTileState.slice());
		}

		if (i < processingTiles.length) {
			processingTiles[i] = columns;
		} else {
			processingTiles.push(columns);
		}
	}
}

var addRobotsToList = function(numRobots) {
	// This creates the list up to the point of the robotID.
	// i.e. add robots to the list to accomdate more stuff being added

	// Quadrants are numbered 0 - 3 starting from the bottom left-hand corner
	// xPrev/yPrev will be out of bounds of the tiles array since we will not
	// always be in the bottom left hand corner now
	for(var i = robots.length; i < numRobots; i++) {
		robots.push({id: i, xPrev: 0, yPrev: 0,
		 xAfter: 0, yAfter: 0, quadrant: 0, robotStatus: 2, orientation: 0 });
	}
}

/*
 * Function to round position to correspond to bottom left corner of tile.
 * Gets position in tiles list.
 */
var roundPosition = function(pos) {
	if (pos < 0) {
		return 0;
	} else if (pos > length) {
		return length;
	} else  {
		return Math.floor(pos + 0.1);
	}
}

var resetRobot = function(robotID) {
	robots[robotID] = {id: robotID, xPrev: 0, yPrev: 0,
		xAfter: 0, yAfter: 0, quadrant: 0, robotStatus: 2}

	// id, x,  y, status
	sendStatusUpdate(robotID);
}

var setRecalibrationStatus = function(robotID) {
	robots[robotID].robotStatus = 4;

	sendStatusUpdate(robotID);
};

var setRobotStatusScanning = function(robotID) {
	robots[robotID].robotStatus = 1;

	sendStatusUpdate(robotID);
};

var robotConnectionLost = function(robotID) {
	// Set the robot status to calibrating again.
	console.log("CONNECTION LOST CALLED");
	robots[robotID].robotStatus = 3;

	// id, x,  y, status
	sendStatusUpdate(robotID);
};

/*
 * Register communication of tile colour received from robots.
 *
 * Tiles is just a list of intensities. We use the robot start
 * and ending positiong to interpolate the locations of the intensities.
 */
var setTiles = function(robotID, intensities) {
	if (!startedProcessing) {
		// If the processing hasn't started then
		// all the state below hasn't been defined yet.
		return;
	}
	var robot = robots[robotID];

	// Update tile table for current position
	// Get x, y, light intensity, add to processing tiles
	// Set new position of robot
	var coordX = robot.xPrev;
	var coordY = robot.yPrev;
	var delta = Math.pow(Math.pow(robot.xPrev - robot.xAfter, 2) +
		Math.pow(robot.yPrev - robot.yAfter, 2), 0.5) / intensities.length;
	var angle = robot.orientation;

	console.log("TEST " + angle);

	for (var i = 0; i < intensities.length; i++) {
		console.log("TEST " + coordX);

		var thisIntensity = intensities[i];

		var roundedX = roundPosition(coordX);
		var roundedY = roundPosition(coordY);

		if (roundedX > processingTiles.length - 1 ||
			roundedY > processingTiles[roundedX].length - 1) {
			console.log("NON FATAL ERROR -------------------------------");
			console.log("robot off grid");
			setRecalibrationStatus(robotID);
			return;
		}

		processingTiles[roundedX][roundedY].push(thisIntensity);
		// This updates the accepted value for the tile and sends
		// it on to the server.
		tileUpdate(roundedX, roundedY);

		//  Now, update the coordinates
		coordX += delta * Math.cos(angle);
		coordY += delta * Math.sin(angle);
	}

	//check if whole board covered
	if (tilesCovered >= totalTiles) {
		console.log('All tiles covered ');
		communication.stopAll();
	}
}

var getNextCorner = function(quadrantNo) {
	switch (quadrantNo) {
		case 0:
			return {orientation: Math.PI/2, x: 0, y: 0};
		case 1:
			return {orientation: 0, x: 0, y: length - 1};
		case 2:
			return {orientation: -Math.PI/2, x: length - 1, y: length - 1};
		case 3:
			return {orientation: Math.PI, x: length - 1, y: 0};
	}
}

var routeRobot = function(robotID) {
	if (robotID >= robots.length) {
		console.log("unexpected robot " + robotID);
		return;
	}

	// set robots to move to random point within quadrant another module
	// send robotID, and current quadrant corner
	// move will send back the destination of the robot so can set
	// xPrev and yPrev to xAfter and yAfter with data received from route.
	var destination = route.move(robotID, robots[robotID].quadrant);
	console.log('routing from quadrant '+ robots[robotID].quadrant);
	if (destination.stopAll) {
		stopAll();
		return;
	}
	checkTile(robotID, destination.xAfter, destination.yAfter);

	// Update the position of the robot in the webserver.
	sendStatusUpdate(robotID);
}

/*
 * This updates the accepted tile value as appropriate
 */
var tileUpdate = function(coordX, coordY){
	var tile = processingTiles[coordX][coordY];

	// Recalculate the processing tiles[0] value.
	var whiteCount = 0;
	var blackCount = 0;
	for (var i = 1; i < tile.length; i ++) {
		if (tiles[i] === 0) {
			blackCount ++;
		} else {
			whiteCount ++;
		}
	}

	// This sets the default value
	// The >= value means that white is the default
	if (whiteCount >= blackCount) {
		tiles[0] = 1;
	} else {
		tiles[0] = 0;
	}
}

var vectorLength = function(vector) {
	return Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2));
}

/*
 * Set orientation of given robot in direction of tile.
 */
var checkTile = function(robotID, tileX, tileY){
	console.log('------------');
	// Prev always stores starting corner, we interpolate between this and
	// tileX, tile Y. After checkTile returns, robots will store the new corner
	// as prev but the tile just travelled to in after.
	console.log(robots[robotID]);
	var cornerX = robots[robotID].xPrev;
	var cornerY = robots[robotID].yPrev;

	// [opp, adj]
	var vectorToTile = [Math.abs(tileX - cornerX), Math.abs(tileY - cornerY)];
	console.log(vectorToTile[0]);
	console.log(vectorToTile[1]);
	var angle = Math.atan(vectorToTile[0]/vectorToTile[1])
	var distance = vectorLength(vectorToTile);

	console.log('From x=' + cornerX + ' y='+ cornerY
	+ ' going to x=' + tileX +' y=' + tileY + ' with angle ' + angle*180/Math.PI);

	// Turn by angle (0 to pi) clockwise
	// communication.move now takes (robotID, angle, distance)
	// Server needs to keep track of location of robot.
	communication.move(robotID, angle, distance*tileSize);


	// get next corner to be xPrev
	robots[robotID].quadrant = (robots[robotID].quadrant + 1) % 4
	var nextCorner = getNextCorner(robots[robotID].quadrant);

	robots[robotID].xPrev = nextCorner.x;
	robots[robotID].yPrev = nextCorner.y;

	robots[robotID].xAfter = tileX;
	robots[robotID].yAfter = tileY;

	robots[robotID].orientation = nextCorner.orientation + angle;

	// And set the robot status to moving
	setRobotStatusScanning(robotID);
}

/*
* Get robot that is in given quadrant that will be routed to tile that
* needs to be re-checked
*/
var getRobotByQuadrant = function(quadrantNo) {
	var index = -1;

	for (var i = 0; i < robots.length; i++) {
		if (robots[i].quadrant === quadrantNo) {
			index = i;
		}
	}

	return index;
}

var getQuadrant = function(coordX, coordY) {
  if (coordX < Math.round(length/2)) {

    if (coordY < Math.round(length/2)) {
      return 0;
    } else {
      return 1;
    }

  } else {

    if (coordY < Math.round(length/2)) {
      return 3;
    } else {
      return 2;
    }

  }
}

/*
 * This tells callers whether the processor
 * has started mapping or not yet
 */
var hasStartedProcessing = function() {
	return startedProcessing;
}

/*
 * This unpacks the dictionary for the robot status and sends it on to the
 * server
 */
var sendStatusUpdate = function(robotID) {
	var robot = robots[robotID];
	server.updateStatus(robotID, robot.xAfter, robot.yAfter, robot.robotStatus);
}

/*
 * Command from user to resume traversal of robots
 * Sent to communication.js to notify the robots.
 */
var resume = function(robotID) {
	robots[robotID].robotStatus = 1;
	sendStatusUpdate(robotID);
	// TODO -- Talk to Jamie about changing the webapp to remove
	// the individual resume button. In this new model, resume
	// is better done by restarting the robot perhaps?
	// communication.resume(robotID);
}

/*
 * Command from user to stop the traversal of one robot
 */
var stop = function(robotID) {
	robots[robotID].robotStatus = 2;
	sendStatusUpdate(robotID);
	communication.stop(robotID);
}

/*
 * Command from user to stop the traversal of all robots
 */
var stopAll = function() {
	for (var i = 0; i < robots.length; i ++) {
		robots[i].robotStatus = 2;
		sendStatusUpdate(i);
	}
	communication.stopAll();
}

/*
 * Get user input of tile size
 */
var setTileSize = function(size) {
	tileSize = size;
}

var getTileSize = function() {
	return tileSize;
}

var setGridDimensions = function(sizes) {
	width = sizes.x;
	length = sizes.y;
	createTilesList();
}

var setRobotStates = function(numRobots) {
	// This adds up to `numRobots` robots
	addRobotsToList(numRobots);
}

var getGridDimensions = function() {
	return {x: width, y: length};
}

var startProcessing = function() {
	startedProcessing = true;
	route.setUp(width); // set up uncheckedTiles lists
	// starts all the connected robots waiting on the
	// starting ramp.
	communication.startRobots(tileSize);
}

var getRobots = function() {
	return robots;
}

exports.hasStartedProcessing = hasStartedProcessing;
exports.setTileSize = setTileSize;
exports.getTileSize = getTileSize;
exports.setGridDimensions = setGridDimensions;
exports.getGridDimensions = getGridDimensions;
exports.setRobotStates = setRobotStates;
exports.addRobotsToList = addRobotsToList;
exports.resume = resume;
exports.stop = stop;
exports.stopAll = stopAll;
exports.setTiles = setTiles;
exports.startProcessing = startProcessing;
exports.routeRobot = routeRobot;
exports.getRobots = getRobots;
exports.resetRobot = resetRobot;
exports.robotConnectionLost = robotConnectionLost;
exports.getQuadrant = getQuadrant;

/*
 * Unit testing
 * Module exports added for testing
 */
if (TEST) {
	exports.createTilesList = createTilesList;
	exports.processingTiles = processingTiles;
	exports.initialTileState = initialTileState;
	exports.robots = robots;
	exports.width = width;
	exports.length = length;
	exports.tilesCovered = tilesCovered;
	exports.totalTiles = totalTiles;
	exports.checkTile = checkTile;

	exports.roundPosition = roundPosition;
	exports.vectorLength = vectorLength;

	var setCoveredToTotalTiles = function() {
		tilesCovered = totalTiles;
	}
	exports.setCoveredToTotalTiles = setCoveredToTotalTiles;
}
