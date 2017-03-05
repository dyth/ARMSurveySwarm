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
var tiles = [];



/* Array holding the current corner coordinates, destination tile coordinates,
 * status and current quadrant number.
 *
 * Potential states of the robots -- Waiting: 0, Scanning:  1, Stopped: 2
 * Array order is by robot ID.
 * For the status, it is an index in the array 'states' in state.js
 * on the frontend
 */
var robots = [];



/* Grid size is width of the board in the number of tiles.
 * Tile size is in mm
 */
var gridSize = 0;
var tileSize = 0;


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
 * Create new tiles list, called after the user has entered
 * the grid dimensions.
 * Does not delete any contents of the list if they are already defined.
 */
 var initTiles = function () {

     for(var i = 0; i < gridSize; i++){
         tiles[i] = [];
         for(var j = 0; j < gridSize; j++){
             tiles[i][j] = {accepted: 2, black: 0, white: 0};
         }
     }

 };


/*
 * Adds a robot to the list when robot is connected.
 * Robots start at corner 0 before moving to one of the four corners of the
 * floor pattern.
 * Quadrants are numbered 0 - 3 starting from the bottom left-hand corner.
 */
var addRobotToList = function(robotID) {
	// TODO: Don't ignore reconnecting robots
	// Move all other robots to next corner
	for(var i = 0; i < robots.length; i++){
			if(robots[i] !== undefined)
					moveToNextCorner(i);
	}

	robots[robotID] = {xDest: 0, yDest: 0, corner: 0, robotStatus: 0};

	connectedRobots++;
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
 * Set user input of tile size
 */
var setTileSize = function(size) {
	tileSize = size;
};


/*
 * Sets height and width of board in tile number given by user
 */
var setGridDimensions = function(size) {
	gridSize = size;
	initTiles();
};


/*
 * Gets height and width of board in tile number given by user
 */
var getGridSize = function() {
	return gridSize;
};


/*
 * Called when the robots are all connected to start routing
 */
var startProcessing = function() {
	startedProcessing = true;
	route.setUp(width); // set up uncheckedTiles lists

	for (var i = 0; i < robots.length; i ++) {
		// This sends the start message to the robots.
		if (robots[i] != undefined) {

			communication.sendStart(i, tileSize);
			nextMove(i);
		}
	}
};


/* Robot moves clockwise to the next corner, entering the next quadrant */
var moveToNextCorner = function (robotId) {

    //communication.sendNextCorner(robotId);
    robots[robotId].corner = (robots[robotId].corner + 1) % 4;
};



/*
 * Called when a robot reaches the next corner and sends back
 * a list of intensities. The server gets the next tile to move to using route,
 * creates the instruction to send to the robot and sends it over WiFi.
 */
 var nextMove = function (robotId) {

     waitingRobots++;

     if(waitingRobots === connectedRobots){

         // Give each robot a new instruction
         for(var id = 0; id < robots.length; id++){

             var robot = robots[id];

             if(robot === undefined) continue;

             // Calculate the next move
             var startCorner = cornerToCoordinates(robot.corner);
             var next = route.move(startCorner.x, startCorner.y);

             if(next.stopAll){

                 communication.sendStop(id);
                 setRobotStatusStopped(id);

             }
             else{

                 robot.xDest = next.xAfter;
                 robot.yDest = next.yAfter;

                 var instructions = convertToRobotInstructions(startCorner.x, startCorner.y, robot.xDest, robot.yDest, robot.corner);

                 communication.sendMove(id, radToDeg(instructions.angle), instructions.distance);
                 setRobotStatusScanning(id);

                 console.log('('+startCorner.x+','+startCorner.y+') -> ('+robot.xDest+','+robot.yDest+') with angle '+radToDeg(instructions.angle)+' and distance '+instructions.distance)

             }

         }

         waitingRobots = 0;

     }
     else {
         setRobotStatusWaiting(robotId);
     }

 };


 /*
  * Register communication of tile colour received from robots.
  *
  * Input is robot ID and a list of light intensities. We use the robot start
  * and ending positiong to interpolate the locations of the intensities to
  * retrieve the colour of each tile passed.
  */
 var handleDone = function(robotId, intensities){

     var robot = robots[robotId];

     // Calculate the start position
     var startCorner = cornerToCoordinates(robot.corner);

     // Working variables
     var x = startCorner.x;
     var y = startCorner.y;


     var deltaX = (robot.xDest - startCorner.x) / intensities.length;
     var deltaY = (robot.yDest - startCorner.y) / intensities.length;

     for(var i = 0; i < intensities.length; i++){

         x += deltaX;
         y += deltaY;

         var intensity = intensities[i];

         var xCoord = Math.floor(x);
         var yCoord = Math.floor(y);

         if(intensity < 400){
             tiles[xCoord][yCoord].white++;
         }
         else if(intensity > 600) {
             tiles[xCoord][yCoord].black++;
         }

         updateTile(xCoord, yCoord);

     }

     // Update the robot state
     robot.corner = (robot.corner + 1) % 4;

 };


/*
 * This updates the accepted tile value to be either black, white or grey.
 * If euqal numbers of robots have asserted that the tile is black and white,
 * the tile is set to grey and will be checked by another robot. Otherwise it
 * set to the colour which the majority of robots have scanned.
 */
var updateTile = function(x, y){
	var tile = tiles[x][y];

	// Recalculate the processing accepted value.
	// This sets the default value
	if (tile.white > tile.black) {
		tile.accepted = 1;
	} else if (tile.black > tile.white) {
		tile.accepted = 0;
	} else {
		tile.accepted = 2; // grey
	}

	server.updateTile(x, y, tile.accepted);
};

/* Get next data for corner given the quadrant that the robot is in */
var cornerToCoordinates = function(corner) {
	switch (corner) {
		case 0: return {x: 0, y: 0};
		case 1: return {x: 0, y: gridSize - 1};
		case 2: return {x: gridSize - 1, y: gridSize - 1};
		case 3: return {x: gridSize - 1, y: 0};
	}
}

/*
 * Return a dictionary of the distance and the clockwise angle through
 * which the robot will rotate.
 */
var convertToRobotInstructions = function(startX, startY, endX, endY, corner){

    var deltaX = Math.abs(endX - startX);
    var deltaY = Math.abs(endY - startY);

    var angle;
    var distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

    if(corner % 2 === 0) angle = Math.atan(deltaX / deltaY);
    else angle = Math.atan(deltaY / deltaX);

    return {angle: angle, distance: (distance * tileSize)};

};


/* Convert angle in radians to degrees */
var radToDeg = function (rad) {
    return rad * 180 / Math.PI;
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
 * This unpacks the dictionary for the robot status and sends it on to the
 * server
 */
var sendStatusUpdate = function(robotID) {
	var robot = robots[robotID];
	server.updateStatus(robotID, robot.xAfter, robot.yAfter, robot.robotStatus);
};


/*
 * Send message to webapp to update status of robot to stopped.
 * Robots can be stopped by user or are stopped by the server when all tiles
 * have been covered.
 */
var setRobotStatusStopped = function(robotID) {
	robots[robotID].robotStatus = 2;

	sendStatusUpdate(robotID);
};


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
 * Send message to webapp to update status of robot to waiting.
 * Status is set to waiting when the robots are waiting for remaining robots
 * to get to a corner.
 */
var setRobotStatusWaiting = function(robotID) {
	robots[robotID].robotStatus = 0;

	sendStatusUpdate(robotID);
};


exports.setTileSize = setTileSize;
exports.setGridDimensions = setGridDimensions;
exports.getGridSize = getGridSize;
exports.addRobotToList = addRobotToList;
exports.handleDone = handleDone;
exports.startProcessing = startProcessing;
exports.nextMove = nextMove;
exports.robotConnectionLost = robotConnectionLost;
exports.setRobotStatusStopped = setRobotStatusStopped;
exports.stop = stop;


/*
 * Module exports added for testing
 */
if (TEST) {
	exports.initTiles = initTiles;
	exports.tiles = tiles;
	exports.robots = robots;
	exports.gridSize = gridSize;
	exports.updateTile = updateTile;
	exports.moveToNextCorner = moveToNextCorner;
	exports.connectedRobots = connectedRobots;
	exports.waitingRobots = waitingRobots;
	exports.cornerToCoordinates = cornerToCoordinates;
	exports.convertToRobotInstructions = convertToRobotInstructions;
	exports.radToDeg = radToDeg;


	exports.setConnectedRobots = function() {
		connectedRobots = 0;
	}

	exports.unconnectAllRobots = function() {
		robots.length = 0;
	}

	exports.resetTiles = function() {
		tiles.length = 0;
	}

}
