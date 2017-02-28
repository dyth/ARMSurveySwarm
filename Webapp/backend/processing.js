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
var initialTileState = [2,2,2,2,2,2];

// array order is by ID
// for the status, it is an index in the array  'states' in state.js
// on the frontend:
// 	Calibrating: 0, Scanning:  1, Stopped: 2, Disconnected: 3
// Orientation in Radians
var robots = [];

var width = 0;
var length = 0;
var tilesCovered = 0;
var totalTiles = 0;
var tileSize = 0;
var startedProcessing = false;

/*
 * Create new tilesList
 *
 * Does not delete any contents of the list
 * if they are already defined.
 */
var createTilesList = function() {
	totalTiles = width * length;
	// Increases the number of tiles up to the
	// width and length.
	for(var i = processingTiles.length; i < width; i++){
		var columns = [];

		if (i < processingTiles.length) {
			// There are already tiles here.
			// We don't want to lose information on them.
			columns = processingTiles[i];
		}

		for(var j = columns.length; j < length; j++) {
			// initial tile state is a 6 element list.
			columns.push(initialTileState.slice());
		}

		if (i < processingTiles.length) {
			processingTiles[i] = columns;
		} else {
			processingTiles.push(columns);
		}
	}
}

var addRobotsToList = function(robotID) {
	// This creates the list up to the point of the robotID.
	// i.e. add robots to the list to accomdate more stuff being added
	for(var i = robots.length; i < robotID; i++) {
		robots.push({id: i, xPrev: 0,yPrev: 0,
			 xAfter: 0, yAfter: 0, orientation: 0, robotStatus: 2 });
	}
}


/* Function to round accurate position to correspond
 * to bottom left corner of tile.
 * Get position in list.
 */
var roundPosition = function(pos) {
	if (pos < 0) {
		return 0;
	} else if (pos > length * tileSize) {
		return length;
	} else {
		return Math.floor(pos/tileSize);
	}
}

var resetRobot = function(robotID) {
	robots[robotID] = {id: robotID, xPrev: 0,yPrev: 0,
		xAfter: 0, yAfter: 0, orientation: 0, robotStatus: 2}

	// id, x,  y, status
	server.updateStatus(robotID, 0, 0, 1);
}

var robotConnectionLost = function(robotID) {
	// Set the robot status to calibrating again.
	console.log("CONNECTION LOST CALLED");
	robots[robotID].robotStatus = 3;
	var robot = robots[robotID];

	// id, x,  y, status
	server.updateStatus(robotID, robot.x, robot.y, robot.robotStatus);
}

/*
 * Register communication of tile colour received from robots.
 */
var setTiles = function(robotID, messages) {
	if (!startedProcessing) {
		// If the processing hasn't started then
		// all the state below hasn't been defined yet.
		return;
	}

	// Update tile table for current position
	// Get x, y, light intensity, add to processing tiles
	// Set new position of robot
	var coordX = 0;
	var coordY = 0;
	var lightIntensity = 0;
	for (var i = 0; i < messages.length; i++) {
		coordX = roundPosition(messages[i].x);
		coordY = roundPosition(messages[i].y);
		lightIntensity = messages[i].lightIntensity;

		processingTiles[coordX][coordY][robotID] = lightIntensity;

		server.updateTile(coordX, coordY, 3);
		server.updateStatus(robotID, coordX, coordY, robots[robotID].robotStatus);
		// if two robots agree on colour, set finalColour,
		twoColoursAgree(coordX, coordY);
	}

	//check if whole board covered
	if (tilesCovered == totalTiles) {
		communication.stopAll();
	}
}

var routeRobot = function(robotID) {
	if ( robotID >= robots.length) {
		console.log("unexpected robot " + robotID);
		return;
	}

	console.log("routing robot " + robotID);

	// set robots to move to random point in another module
	// send robotID, last x position, last y position
	// move will send back the destination of the robot so can set
	// xA and yA to xB and yB and set Afters with data received from route.
	var destination = route.move(robotID);
	if (destination.stopAll) {
		stopAll();
		console.log('stop all called');
		return;
	} else if (destination.wait) {
		communication.wait(robotID);
		console.log('robot ' + robotID + ' waiting');
		return;
	}

	robots[robotID].xPrev = robots[robotID].xAfter;
	robots[robotID].yPrev = robots[robotID].yAfter;

	robots[robotID].xAfter = destination.xAfter;
	robots[robotID].yAfter = destination.yAfter;

	// convert next location to angle + distance and call communication.move in
	// checkTile
	checkTile(robotID, robots[robotID].xAfter, robots[robotID].yAfter);

	// Update the position of the robot in the webserver.
	server.updateStatus(robotID);
}

/*
 * At least two robots need to agree on colour for the final colour to be set,
 * which is then sent to the webapp.
 * If two robots disagree, delegate another robot to re-check the tile.
 */
var twoColoursAgree = function(coordX, coordY){

	var numWhite = 0;
	var numBlack = 0;
	var tile = processingTiles[coordX][coordY];
	var potentials = [];

	for (var i = 0; i < 5; i++){
		if (tile[i] == 0) {
			numBlack += 1;
		} else if (tile[i] == 1) {
			numWhite += 1;
		} else {
			potentials.push(i);
		}
	}

	if (numWhite == numBlack) {
		// potentials are robots other than those that already checked
		var robotID = potentials[Math.floor(Math.random() * potentials.length)];
		checkTile(robotID, coordX, coordY);

	} else if (numWhite > numBlack && numWhite >= 2) {
		processingTiles[coordX][coordY][5] = 1;
		server.updateTile(coordX, coordY, 1);
		route.removeTile(coordX, coordY);
		tilesCovered += 1;

	} else if (numBlack > numWhite && numBlack >= 2) {
		processingTiles[coordX][coordY][5] = 0;
		server.updateTile(coordX, coordY, 0);
		route.removeTile(coordX, coordY);
		tilesCovered += 1;
	}
}

var vectorLength = function(vector) {
	return Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2));
}

/*
 * Set orientation of given robot in direction of tile.
 */
var checkTile = function(robotID, tileX, tileY){
	console.log('Routing to x=' + tileX + ' y = ' + tileY);
	// Currently direct line to tile
	var coordX = robots[robotID].xPrev;
	var coordY = robots[robotID].yPrev;

	if (coordX == tileX && coordY == tileY){
		console.log("Routing to current tile - abort. ");
		// Add a wait so that the robot calls back to the server
		// and asks again later.
		communication.wait(robotID);
		return;
	}

	var orientation = robots[robotID].orientation;
	var A = [tileX - coordX, tileY - coordY]; // vector for current pos to tile


	var B = [Math.sin(orientation), Math.cos(orientation)]; // current orientation of robot


	// Find angle between current robot orientation and direction to tile
	// a.b = |a||b| sin(theta)
	var cos_theta = (A[0]*B[1] - A[1]*B[0])/(vectorLength(A)*vectorLength(B));


	var angle = Math.acos(cos_theta);

	if (angle < 0) {
		angle += 2*Math.PI;
	}
	console.log('from x=' + coordX + ' ,y='+ coordY + ' going to x=' + tileX +' y=' + tileY);
	console.log('angle ' + angle*180/Math.PI);

	// Turn by angle clockwise
	communication.move(robotID, coordX * tileSize, coordY * tileSize,
		orientation, angle, vectorLength(A)*tileSize);

	//Set new orientation of robotID
	rotateClockwise(robotID, angle);
}

var rotateClockwise = function(robotID, radians) {
	var currentOrientation = robots[robotID].orientation;
	robots[robotID].orientation = (currentOrientation + radians) % 2*Math.PI;
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
	server.updateStatus(robotID, robot.xPrev, robot.yPrev, robot.robotStatus);
}

/*
 * Command from user to resume traversal of robots
 * Sent to communication.js to notify the robots.
 */
var resume = function(robotID) {
	robots[robotID].robotStatus = 1;
	sendStatusUpdate(robotID);
	communication.resume(robotID);
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
	communication.startRobots();
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

	exports.roundPosition = roundPosition;
	exports.rotateClockwise = rotateClockwise;
	exports.vectorLength = vectorLength;

	var setCoveredToTotalTiles = function() {
		tilesCovered = totalTiles;
	}
	exports.setCoveredToTotalTiles = setCoveredToTotalTiles;
}
