/*
 * Kamile Matulenaite, Jackson Woodruff, Jamie Davenport
 * Backend of the system dealing with
 * -  relaying messages between the robots and the webapp
 * -  storing the state of each tile that makes up the floor pattern
 * -  storing robot state
 * - interpolation between start and destination positions to parse light
 *	 intensity information
 */

// dependencies for this module
var server = require('./server');
var communication = require('./communication');
var route = require('./route');


// flag used for exports of functions used in test harnesses
var TEST = true;


/* State of floor tiles making up pattern.
 *
 * A 2D array indexed by Cartesian coordinates where each tile is defined
 * using a dictionary storing the number of robots that have asserted that the
 * tile colour is either black or white. The accepted attribute is set once
 * more than two robots agree on the colour of a tile.
 */
var processingTiles = [];



/* Array holding the current corner coordinates, destination tile coordinates,
 * status and current quadrant number.
 *
 * Potential states of the robots -- Waiting: 0, Scanning:  1, Stopped: 2
 * Array order is by robot ID.
 * For the status, it is an index in the array 'states' in state.js
 * on the frontend
 */
var robots = [];



/* Height and width of the board in the number of tiles.
 * Tile size is in mm
 */
var width = 0;
var height = 0;
var tileSize = 0;


/* Total tiles to be covered is width * height.
 * Number of tiles covered initially is set to 0.
 */
var tilesCovered = 0;
var totalTiles = 0;


/* Sets up unchecked tiles list upon receipt of the grid dimensions from the user
 * Once all robots are connected they can be sent START messages and be routed.
 */
var startedProcessing = false;


/* State to coordinate robots.
 * A robot at the corner is a waiting robot where all robots have to be at a
 * corner before the next move is given.
 */
var connectedRobots = 0;
var waitingRobots = 0;


/*
 * Create new processingTiles list, called after the user has entered
 * the grid dimensions.
 * Does not delete any contents of the list if they are already defined.
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
			// for each one. Accepted is 2 by default as an unchecked tile.
			columns.push({accepted: 2, black: 0, white: 0});
		}

		if (i < processingTiles.length) {
			processingTiles[i] = columns;
		} else {
			processingTiles.push(columns);
		}
	}
}


/*
 * Adds a robot to the list when robot is connected.
 * Robots start at corner 0 before moving to one of the four corners of the
 * floor pattern.
 * Quadrants are numbered 0 - 3 starting from the bottom left-hand corner.
 */
var addRobotToList = function(robotID) {
	robots[robotID] = {xCorner: 0, yCorner: 0,
		xAfter: 0, yAfter: 0, quadrant: 0, robotStatus: 2};

	connectedRobots++;
}

/*
 * Send message to webapp to update status of robot to stopped.
 * Robots can be stopped by user or are stopped by the server when all tiles
 * have been covered.
 */
var setRobotStatusStopped = function(robotID) {
	robots[robotID].robotStatus = 2;

	sendStatusUpdate(robotID);
}


/*
 * Send message to webapp to update status of robot to scanning.
 * Status is set to scanning when robots are being routed to a tile
 * on the floor pattern.
 */
var setRobotStatusScanning = function(robotID) {
	robots[robotID].robotStatus = 1;

	sendStatusUpdate(robotID);
};


/*
 *
 */
var setRobotStatusWaiting = function(robotID) {
	robots[robotID].robotStatus = 0;

	sendStatusUpdate(robotID);
}


/*
 * Set the robot status to waiting and decrease the number of connected robots.
 */
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
 * Input is robot ID and a list of light intensities. We use the robot start
 * and ending positiong to interpolate the locations of the intensities to
 * retrieve the colour of each tile passed.
 */
var setTiles = function(robotID, intensities) {
	var robot = robots[robotID];

	console.log("DATA: " + intensities);

	if (intensities.length === 0) {
		console.log("No intensities provided");

		return;
	}

	// Update tile table for current position
	// Get x, y, light intensity, add to processing tiles
	var coordX = robot.xCorner;
	var coordY = robot.yCorner;
	var delta = Math.pow(Math.pow(robot.xCorner - robot.xAfter, 2) +
		Math.pow(robot.yCorner - robot.yAfter, 2), 0.5) / intensities.length;

	// Need the angle with the offset.
	var angle =  getAngleWithOffset(robotID);

	for (var i = 0; i < intensities.length; i++) {
		var thisIntensity = intensities[i];

		var roundedX = Math.round(coordX);
		var roundedY = Math.round(coordY);

		console.log(coordX, coordY);
		console.log(angle * 180 / Math.PI);

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
	var nextCorner = getCorner(robot.quadrant);

	robot.xCorner = nextCorner.x;
	robot.yCorner = nextCorner.y;

}


/* Get next data for corner given the quadrant that the robot is in */
var getCorner = function(quadrantNo) {
	switch (quadrantNo) {
		case 0:
			return {orientation: Math.PI/2, x: 0, y: 0};
		case 1:
			return {orientation: 2 * Math.PI, x: 0, y: height - 1};
		case 2:
			return {orientation: 3 * Math.PI/2, x: height - 1, y: height - 1};
		case 3:
			return {orientation: Math.PI, x: height - 1, y: 0};
		default:
			return {orientation: Math.PI/2, x: 0, y: 0};
	}
}

/*
 * Returns the robot's orientation with respect to the x-axis
 */
var getAngleWithOffset = function(robotID) {
	var robot = robots[robotID];
	// This keeps the orientation offset from the way that
	// the robot is facing.
	//
	// Note that offset is along the yAxis.
	var offset = getCorner(robot.quadrant).orientation;
	var angleNoOffset = getAngleNoOffset(robotID);

	console.log('offset' + offset * 180 / Math.PI);
	console.log('no offset' + angleNoOffset * 180 / Math.PI);
	return offset - angleNoOffset;
}


/*
 * Returns the angle with respect to the
 * robot's current orientation.
 */
var getAngleNoOffset = function(robotID) {
	var robot = robots[robotID];
	var quadrant = robot.quadrant;

	// Computes the differences:
	var yDiff = Math.abs(robot.yAfter - robot.yCorner);
	var xDiff = Math.abs(robot.xAfter - robot.xCorner);


	if (yDiff === 0) {
		// If there is no yDiff, then the robot
		// is heading along the xAxis and so we
		// return the angle along that
		if (quadrant % 2 === 0) {
			// How much the robot turns given
			// it's position depends on where it is
			// on the board
			return Math.PI / 2;
		} else {
			return 0;
		}
	}

	if (xDiff === 0) {
		// If there is no xDiff, then the robot
		// is heading straight up the yAxis.
		// Therefore, we just return orientation.
		if (quadrant % 2 === 0) {
			// How much the robot turns
			// given it's position depends on
			// where it is on the board
			//
			// Remember that the orientation of the robot
			// is always towards the y-axis
			return 0;
		} else {
			return Math.PI / 2;
		}
	}

	var opp;
	var adj;

	// Which one is opposite and adjacent depends
	// on which way the robot is facing.
	if (robot.quadrant % 2 === 0) {
		opp = xDiff;
		adj = yDiff;
	} else {
		opp = yDiff;
		adj = xDiff;
	}

	return Math.atan(opp / adj);
};


/*
 * Called when a robot reaches the next corner and sends back a list of intensities
 */
var nextMove = function (robotID) {

	// The robot is now waiting
	waitingRobots++;

	if(waitingRobots === connectedRobots) {
		// Give each robot a new instruction
		for(var id = 0; id < robots.length; id++) {
			if (robots[id] === undefined) {
				// If ther robot is not defined, then there is a
				// robot somewhere else that is defined.
				continue;
			}
			// Get the robot
			var robot = robots[id];
			// Calculate the next move
			var next = route.move(robot.xCorner, robot.yCorner);

			if(next.stopAll){
				// Stop the robot
				communication.sendStop(id);

				// Set the robot status to stopped
				setRobotStatusStopped(id);

			} else {
				// Update the robot destination
				robot.xAfter = next.xAfter;
				robot.yAfter = next.yAfter;

				// Convert coordinates into angles and distances
				var robotInstructions = convert(id);

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
	if (tiles.white > tiles.black) {
		tiles.accepted = 1;
	} else if (tiles.white === tiles.black) {
		tiles.accepted = 2; //grey
	} else {
		tiles.accepted = 0;
	}

	server.updateTile(coordX, coordY, tiles.accepted);
};

var vectorLength = function(vector) {
	return Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2)) * tileSize;
};


/*
 * Return a dictionary of the distance and the clockwise angle through
 * which the robot will rotate.
 */
var convert = function(robotID){

	var robot = robots[robotID];

	// The robot always stores starting corner, we interpolate between this and
	// tileX, tile Y. After checkTile returns, robots will store the new corner
	// as prev but the tile just travelled to in after.
	var changeInX = Math.abs(robot.xCorner - robot.xAfter);
	var changeInY = Math.abs(robot.yCorner - robot.yAfter);

	var angle = getAngleNoOffset(robotID);
	var distance = vectorLength([changeInX, changeInY]);

	console.log('From x=' + robot.xCorner + ' y='+ robot.yCorner
		+ ' going to x=' + robot.xAfter +' y=' + robot.yAfter + ' with angle '
		+ angle*180/Math.PI + ' and distance ' + distance);

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


/*
 * Sets height and width of board in tile number given by user
 */
var setGridDimensions = function(sizes) {
	width = sizes.x;
	height = sizes.y;
	createTilesList();
};


/*
 * Gets height and width of board in tile number given by user
 */
var getGridDimensions = function() {
	return {x: width, y: height};
};


/*
 * Called when the robots are all connected to start routing
 */
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
	exports.vectorLength = vectorLength;
	exports.tileUpdate = tileUpdate;
	exports.convert = convert;
	exports.getCorner = getCorner;
	exports.connectedRobots = connectedRobots;
	exports.waitingRobots = waitingRobots;
	exports.getAngleNoOffset = getAngleNoOffset;
	exports.getAngleWithOffset = getAngleWithOffset;

	exports.setCoveredToTotalTiles = function() {
		tilesCovered = totalTiles;
	}

	exports.getConnectedRobots = function() {
		return connectedRobots;
	}

	exports.setConnectedRobots = function() {
		connectedRobots = 0;
	}

	exports.unconnectAllRobots = function() {
		robots.length = 0;
	}

	exports.resetProcessingTiles = function() {
		processingTiles.length = 0;
	}

}
