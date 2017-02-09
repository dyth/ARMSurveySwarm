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
var initialState = [2,2,2,2,2,2];
var robots = [[0,0], [0,0], [0,0], [0,0], [0,0]];
var byUncertainty = [0,1,2,3,4];
var width;
var length;
var tilesCovered = 0;
var totalTiles;

// create new tilesList
var createTilesList = function(nX, nY) {
  totalTiles = nX * nY;
  width = nX;
  length = nY;
  // set each tile to unknown = 2
  for(i = 0; i < nX; i++){
    var columns = [];
    for(j = 0; i < nY; j++) {
      columns.push(initialState);
    }
    processingTiles.push(columns);
  }
}

var x = createTilesList();

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
  return finalTiles;
}

var move = function(robotID, coordX, coordY) {
  // update robot position in list
  robots[robotID][0] = coordX;
  robots[robotID][1] = coordY;
}

var setTile = function(robotID, lightIntensity) {
  //TODO: round position to correspond to tile position.

  // update tile table for current position
  var coordX = robots[robotID][0];
  var coordY = robots[robotID][1];
  processingTiles[coordX][coordY][robotID] = lightIntensity;

  // if two robots agree on colour, set finalColour,
  twoColoursAgree(coordX, coordY);

  // check for collisions with 4 other robots
  if (willCollide(robotID)) {
    // move away - straight line or right angles?
  }

  //check if whole board covered
  if (tilesCovered == totalTiles) {
    //TODO: stop all robots
    //stop(robot) in communication.js;
  }

}

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
    tilesCovered += 1;
  } else if (numBlack > numWhite && numBlack >= 2){
    processingTiles[coordX][coordY][5] = 0;
    tileCovered += 1;
  }
}

var reccheckTile = function(robotID, tileX, tileY){
  // set orientation of robot to move towards that tile
  // ??? how to we check that this action has been achieved? what if
  // collision detection makes it change direction before completion?
}

var willCollide = function(robotID) {
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

  var l1 = robots[robotID][0] - 1;
  var r1 = robots[robotID][0] + 1;
  var b1 = robots[robotID][1] - 1;
  var t1 = robots[robotID][1] + 1;
  var l2, r2, b2, t2;

  var potentials = robots.slice(0, robotID).append(robots.slice(robotID+1, 6));
  var collision = false;

  for (i = 0; i < 4; i ++) {
    l2 = potentials[i][0] - 1;
    r2 = potentials[i][0] + 1;
    b2 = potentials[i][0] - 1;
    t2 = potentials[i][1] + 1;
    if (l1 < r2 && r1 > l2 && b1 < t2 && t1 > b2) {
      return true;
    }
  }
  return false;
}

var willCollideEdge = function(robotID) {
  // check that robots do not go out of bounds of the floor pattern
  // if robot near 0x, 0y, nx, ny. Turn in the opposite direction
  var coordX = robots[robotID][0];
  var coordY = robots[robotID][1];
  if (coordX <= 0 || coordX >= width) {
    return true;
    //TODO: turn(robotID) in communication.js;
  }

  if (coordY <= 0 || coordY >= length) {
    return true;
    //TODO: turn(robotID) in communication.js;
  }
  return false;
}

var receiveTileSize = function(tileSize) {
	console.log(tileSize);
};

exports.receiveTileSize = receiveTileSize;
exports.willCollide = willCollide;


// Module exports added for testing
if (TEST) {
	var test = function() {
		console.log("test");
	};
	exports.test = test;
	exports.createTilesList = createTilesList;

	exports.processingTiles = processingTiles;
	exports.initialState = initialState;
	exports.robots = robots;
	exports.byUncertainty = byUncertainty;
	exports.width = width;
	exports.length = length;
	exports.tilesCovered = tilesCovered;
	exports.totalTiles = totalTiles;
}
