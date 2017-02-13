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

var TEST = true;

var processingTiles = [];
var initialTileState = [2,2,2,2,2,2];

// array order is by ID
var robots = [{id: 0, x: 0,y: 0, robotStatus: 2},
	{id: 1, x: 0, y: 0, robotStatus: 2}, {id: 2, x: 0,y : 0, robotStatus: 2},
	{id: 3, x: 0, y: 0, robotStatus: 2}, {id: 4, x: 0, y: 0, robotStatus: 2}];
var byUncertainty = [0,1,2,3,4];
var width;
var length;
var tilesCovered = 0;
var totalTiles;
var tileSize;

// create new tilesList
var createTilesList = function(nX, nY) {
  totalTiles = nX * nY;
  width = nX;
  length = nY;
  // set each tile to unknown = 2
  for(i = 0; i < nX; i++){
    var columns = [];
    for(j = 0; j < nY; j++) {
      columns.push(initialTileState);
    }
    processingTiles.push(columns);
  }
}

var getFinalTiles = function(processingTiles) {
  // extract last element in each processingTiles[y][x] to create finalTiles
  var finalTiles = [];
  var nX = processingTiles.length;
  var nY = processingTiles[0].length;
  for(i = 0; i < nX; i++){
    var columns = [];
    for(j = 0; j < nY; j++) {
      columns[j] = processingTiles[i][j][5];
    }
    finalTiles[i] = columns;
  }
}

var move = function(robotID, coordX, coordY) {
  // update robot position in list
  robots[robotID].x = coordX;
  robots[robotID].y = coordY;
}

// Function to round accurate position to correspond
// to bottom left corner of tile.
// Get position in list.
var roundPosition = function(pos) {
  return Math.floor(pos/tileSize);
}

var setTile = function(robotID, lightIntensity) {
  // update tile table for current position
  var coordX = roundPosition(robots[robotID].x);
  var coordY = roundPosition(robots[robotID].y);
  processingTiles[coordX][coordY][robotID] = lightIntensity;

  // if two robots agree on colour, set finalColour,
  twoColoursAgree(coordX, coordY);

  // check for collisions with 4 other robots
  if (willCollide(robotID)) {
    // move away - straight line or right angles?
  }
  if (willCollideEdge(robotID)) {
    communication.changeOrientation(180);
  }

  //check if whole board covered
  if (tilesCovered == totalTiles) {
    communication.stopAll();
  }
}

// set final tile colour, send to webapp
var twoColoursAgree = function(coordX, coordY){
  var numWhite = 0;
  var numBlack = 0;
  var tile = processingTiles[coordX][coordY];

  for (i = 0; i < 5; i++){
    if (tile[i] == 0) {
      numBlack += 1;
    } else {
      numWhite += 1;
    }
  }
  // at least two robots need to agree on colour
  // if two robots disagree, delegate to go check
  // if numbers equal, delegate another to check
  if (numWhite == numBlack) {
    //TODO: robotID = Rand(potentials) (potentials are robot other than those that already checked)
    //TODO: reccheckTile(robotID, orientation, coordX, coordY);
  } else if (numWhite > numBlack && numWhite >= 2) {
    processingTiles[coordX][coordY][5] = 1;
    server.setTile(coordX, coordY, 1);
    tilesCovered += 1;
  } else if (numBlack > numWhite && numBlack >= 2){
    processingTiles[coordX][coordY][5] = 0;
    server.setTile(coordX, coordY, 0);
    tileCovered += 1;
  }
}

var reccheckTile = function(robotID, tileX, tileY){
  // set orientation of robot to move towards that tile
  // ??? how to we check that this action has been achieved? what if
  // collision detection makes it change direction before completion?
}

/* 2D collision between two robots
 * Assume robot takes up one tile.
 * Take axis-aligned bounding box as 3 x 3 tiles.

	 ------t-------
			 |    |
	 --------------
 l     | XX |   r
	 --------------
			 |    |
	 ------b-------
 */
var willCollide = function(robotID) {
  var l1 = robots[robotID].x - tileSize;
  var r1 = robots[robotID].x + tileSize;
  var b1 = robots[robotID].y - tileSize;
  var t1 = robots[robotID].y + tileSize;
  var l2, r2, b2, t2;

  var potentials = robots.slice(0, robotID).append(robots.slice(robotID+1, 6));
  var collision = false;

  for (i = 0; i < 4; i ++) {
    l2 = potentials[i].x - tileSize;
    r2 = potentials[i].x + tileSize;
    b2 = potentials[i].x - tileSize;
    t2 = potentials[i].y + tileSize;
    if (l1 < r2 && r1 > l2 && b1 < t2 && t1 > b2) {
      return true;
    }
  }
  return false;
}
/*
// check that robots do not go out of bounds of the floor pattern
// if robot near 0x, 0y, nx, ny. Turn in the opposite direction
*/
var willCollideEdge = function(robotID) {
  var coordX = robots[robotID].x;
  var coordY = robots[robotID].y;
  if (coordX <= 0 || coordX >= width) {
    return true;
  }
  if (coordY <= 0 || coordY >= length) {
    return true;
  }
  return false;
}

var receiveTileSize = function(tileSize) {
	console.log(tileSize);
};

var resume = function(robotID) {
	communication.resume(robotID);
}

var stop = function(robotID) {
	communication.stop(robotID);
}

var stopAll = function() {
  communication.stopAll();
}

var recieveTileSize = function(size) {
	tileSize = size;
}

var getTileSize = function() {
	return tileSize;
}

var receiveGridDimensions = function(sizes) {
	// TODO -- set up the grid to be the right size when this is called.
	width = sizes.x;
	length = sizes.y;
}

var getGridDimensions = function() {
	return {x: width, y: length};
}

exports.receiveTileSize = receiveTileSize;
exports.getTileSize = getTileSize;
exports.receiveGridDimensions = receiveGridDimensions;
exports.getGridDimensions = getGridDimensions;
exports.willCollide = willCollide;
exports.resume = resume;
exports.stop = stop;
exports.stopAll = stopAll;

// Module exports added for testing
if (TEST) {
	var test = function() {
		console.log("test");
	};
	exports.test = test;
	exports.createTilesList = createTilesList;

	exports.tilesSize = function() {
		return processingTiles.length;
	}

	exports.processingTiles = processingTiles;
	exports.initialTileState = initialTileState;
	exports.robots = robots;
	exports.byUncertainty = byUncertainty;
	exports.width = width;
	exports.length = length;
	exports.tilesCovered = tilesCovered;
	exports.totalTiles = totalTiles;
}
