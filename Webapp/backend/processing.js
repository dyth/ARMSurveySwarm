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
var finalTiles = [];
var initialTileState = [2,2,2,2,2,2];

// array order is by ID
// for the status, it is an index in the array  'states' in state.js
// on the frontend.
// Orienttation in Radians
var robots = [
	{id: 0, xPrev: 0,yPrev: 0, xAfter: 0, yAfter: 0, orientation: 0, robotStatus: 2},
	{id: 1, xPrev: 0,yPrev: 0, xAfter: 0, yAfter: 0, orientation: 0, robotStatus: 2},
	{id: 2, xPrev: 0,yPrev: 0, xAfter: 0, yAfter: 0, orientation: 0, robotStatus: 2},
	{id: 3, xPrev: 0,yPrev: 0, xAfter: 0, yAfter: 0, orientation: 0, robotStatus: 2},
	{id: 4, xPrev: 0,yPrev: 0, xAfter: 0, yAfter: 0, orientation: 0, robotStatus: 2}];

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
      columns.push(initialTileState);
    }

    if (i < processingTiles.length) {
      processingTiles[i] = columns;
	} else {
	  processingTiles.push(columns);
	}
  }
  console.log(processingTiles.length);
}
/* Function to round accurate position to correspond
* to bottom left corner of tile.
* Get position in list.
*/
var roundPosition = function(pos) {
  return Math.floor(pos/tileSize);
}

/*
* Register communication of tile colour received from robots.
*/
var setTile = function(robotID, messages) {
  if (!startedProcessing) {
    // If the processing hasn't started then
    // all the state below hasn't been defined yet.
    return;
  }
  // update tile table for current position

	// List of dictionaries in messages
	// Get x, y, light intensity, add to processing tiles
	// Set new position of robot
	// Check if last position corresponds to position required to recheck tile
	// = task complete.
	var coordX = 0;
	var coordY = 0;
	var lightIntensity = 0;
	for (var i = 0; i < messages.length; i++) {
		coordX = roundPosition(messages[i].x);
		coordY = roundPosition(messages[i].y);
		lightIntensity = messages[i].lightIntensity;
		processingTiles[coordX][coordY][robotID] = lightIntensity;
		server.updateTile(coordX, coordY, lightIntensity);
		server.updateStatus(robotID, coordX, coordY, robots[robotID].robotStatus);
		// if two robots agree on colour, set finalColour,
	  twoColoursAgree(coordX, coordY);
	}

  //check if whole board covered
  if (tilesCovered == totalTiles) {
    communication.stopAll();
  }
  // after updating the tiles, route the robot.
  routeRobot(robotID);
}

var routeRobot = function(robotID) {
	// TODO: check that final destination has completed line needed to be covered.
	console.log(robotID);
	robots[robotID].xPrev = robots[robotID].xAfter;
	robots[robotID].yPrev = robots[robotID].yAfter;

	// set robots to move to random point in another module
	// send robotID, last x position, last y position
	// move will send back the destination of the robot so can set
	// xA and yA to xB and yB and set Afters with data received from route.
 	var destination =
		route.move(robotID, robots[robotID].xPrev, robots[robotID].yPrev);
	robots[robotID].xAfter = destination.xAfter;
	robots[robotID].yAfter = destination.yAfter;

  // // check for collisions with 4 other robots
  // if (willCollide(robotID)) {
  //   //TODO: move away - straight line or right angles?
  // }
	//
  // if (willCollideEdge(robotID)) {
  //   communication.move(robotID, 180, 2); //dummy distance
  // }

	// convert next location to angle + distance and call communication.move in
	// checkTile
	checkTile(robotID, robots[robotID].xAfter, robots[robotID].yAfter);

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
	//TODO : Can't interrupt robot
	var robotID = potentials[Math.floor(Math.random() * potentials.length)];
    reccheckTile(robotID, coordX, coordY);

		// potentials are robots other than those that already checked
		var robotID = potentials[Math.floor(Math.random() * potentials.length)];
    checkTile(robotID, coordX, coordY);

  } else if (numWhite > numBlack && numWhite >= 2) {
    processingTiles[coordX][coordY][5] = 1;
    server.setTile(coordX, coordY, 1);
    tilesCovered += 1;

  } else if (numBlack > numWhite && numBlack >= 2) {
    processingTiles[coordX][coordY][5] = 0;
    server.setTile(coordX, coordY, 0);
    tileCovered += 1;
  }
}

var vectorLength = function(vector) {
	return Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2));
}

/*
* Set orientation of given robot in direction of tile.
*/
var checkTile = function(robotID, tileX, tileY){
	// Currently direct line to tile
	var coordX = robots[robotID].xPrev;
	var coordY = robots[robotID].yPrev;
	var orientation = robots[robotID].orientation;
	var A = [tileX - coordX, tileY - coordY]; // vector for current pos to tile

	// make A unit vector
	A[0] = A[0]/ vectorLength(A);
	A[1] = A[1]/ vectorLength(A);

	var B = [Math.cos(orientation), Math.sin(orientation)]; // current orientation of robot

	// Find angle between current robot orientation and direction to tile
	// axb = |a||b| sin(theta)
	var sin_theta = (A[0]*B[1] - A[1]*B[0])/(vectorLength(A)*vectorLength(B));

	var angle = Math.asin(sin_theta);
	if (angle < 0) {
		angle += 2*Math.PI;
	}

	// Turn by angle clockwise
	communication.move(robotID, angle, vectorLength(A)* tileSize);
	//Set new orientation of robotID
	setOrientation(robotID, angle);
}

var setOrientation = function(robotID, degree) {
	var currentOrientation = robots[robotID].orientation;
	robots[robotID].orientation = (currentOrientation + orientation) % Math.PI;
}

/*
* 2D collision between two robots
* Assume robot takes up one tile.
* Take axis-aligned bounding box as 3 x 3 tiles.
  ------t-------
		 |    |
  --------------
l    | XX |     r
  --------------
		 |    |
  ------b-------
 */
var willCollide = function(robotID) {
  var l1 = robots[robotID].xPrev - tileSize;
  var r1 = robots[robotID].xPrev + tileSize;
  var b1 = robots[robotID].yPrev - tileSize;
  var t1 = robots[robotID].yPrev + tileSize;
  var l2, r2, b2, t2;

  var potentials = robots.slice(0, robotID).concat(robots.slice(robotID+1, 6));

  for (var i = 0; i < potentials.length; i ++) {
    l2 = potentials[i].xPrev - tileSize;
    r2 = potentials[i].xPrev + tileSize;
    b2 = potentials[i].xPrev - tileSize;
    t2 = potentials[i].yPrev + tileSize;
    if (l1 < r2 && r1 > l2 && b1 < t2 && t1 > b2) {
      return true;
    }
  }
  return false;
}

/*
* Check that robots do not go out of bounds of the floor pattern
* If robot near bounding edges of the floor pattern,
* turn in the opposite direction.
*/
var willCollideEdge = function(robotID) {
  var coordX = robots[robotID].xPrev;
  var coordY = robots[robotID].yPrev;
  if (coordX <= 0 || coordX >= width) {
    return true;
  }
  if (coordY <= 0 || coordY >= length) {
    return true;
  }
  return false;
}

/*
 * This unpacks the dictionary for the robot status and sends it on to the
 * server
 */
var sendStatusUpdate = function(robotID) {
	var robot = robots[robotID];
	server.updateStatus(robotID, robot.x, robot.y, robot.robotStatus);
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

var getGridDimensions = function() {
	return {x: width, y: length};
}

var startProcessing = function() {
	startedProcessing = true;

	// Now do the routing for each of the robots to start
	// them off:
	var connectedRobots = communication.getConnectedRobots();
	console.log('starting');

	for (var i = 0; i < connectedRobots.length; i ++) {
		// connectedRobots[i] is an ID.
		routeRobot(connectedRobots[i]);
		console.log('sent out start message');
	}

}

exports.setTileSize = setTileSize;
exports.getTileSize = getTileSize;
exports.setGridDimensions = setGridDimensions;
exports.getGridDimensions = getGridDimensions;
exports.willCollide = willCollide;
exports.resume = resume;
exports.stop = stop;
exports.stopAll = stopAll;
exports.setTile = setTile;
exports.startProcessing = startProcessing;

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
}
