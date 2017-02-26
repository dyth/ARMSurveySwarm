/*
 * 16/02/2017
 * Kamile
 * Routing algorithm to calculate next destination,
 * avoiding collisions
 */

var processing = require('./processing');
var math = require('mathjs');
var TEST = true;

// Each element is dictionary of x, y positions for unchecked tiles
var uncheckedTiles = [];
var firstMove = [];

var setUp = function(length) {
  uncheckedTiles.length = 0;
  firstMove.length = 0;

  for(var i = 0; i < processing.getRobots().length; i++){
    firstMove.push(true);
  }
	for(var i = 0; i < length; i++){
		for(var j = 0; j < length; j++) {
			uncheckedTiles.push({xPos: i, yPos: j});
		}
	}
	removeTile(0,0); // remove starter Tile - all robots will scan at start
}

var removeTile = function(coordX, coordY) {
	var index = -1;

	for (var i = 0; i < uncheckedTiles.length; i ++) {
		if (uncheckedTiles[i].xPos === coordX
				&& uncheckedTiles[i].yPos === coordY) {
			index = i;
			break;
		}
	}

	if (index > -1) {
		uncheckedTiles.splice(index, 1);
	}
}

/*
 * Returns random integer between min and max.
 */
var getRandomInt = function(min, max){
	return Math.floor((Math.random() * max) + min);
}

/*
 * Choose tile to check next, return x and y positions.
 */
var move = function(robotID) {
	if (uncheckedTiles.length == 0) {
		// Covered all tiles?
		return {xAfter: -1, yAfter: -1, stopAll: true, wait: false};
	} else {

    var tilesLeftToTry = uncheckedTiles.slice();

		var tileIndex = getRandomInt(0, uncheckedTiles.length);
		var nextX = uncheckedTiles[tileIndex].xPos;
		var nextY = uncheckedTiles[tileIndex].yPos;

    while (willCollide(robotID, nextX, nextY) && !firstMove[robotID]){

      if (tilesLeftToTry.length == 0) {
        console.log('No tiles left to try. ');
        return {xAfter: -1, yAfter: -1, stopAll: false, wait: true};
      }

      // remove potential tile from tiles left to try for this robot.
      var index = -1;

    	for (var i = 0; i < tilesLeftToTry.length; i ++) {
    		if (tilesLeftToTry[i].xPos === nextX
    				&& tilesLeftToTry[i].yPos === nextY) {
    			index = i;
    			break;
    		}
    	}

    	if (index > -1) {
    		tilesLeftToTry.splice(index, 1);
    	}

      tileIndex = getRandomInt(0, uncheckedTiles.length);
      nextX = uncheckedTiles[tileIndex].xPos;
      nextY = uncheckedTiles[tileIndex].yPos;
    }
    firstMove[robotID] = false;
		return {xAfter: nextX, yAfter: nextY, stopAll: false, wait: false};
	}
}

/*
* Check that given robot direction will not interfere with other
* traversal or robots
*/
var willCollide = function(robotID, nextX, nextY) {
  var robots = processing.getRobots().slice();

  // get proposed path line
  var currentStartPoint = [robots[robotID].xPrev, robots[robotID].yPrev];
  var currentEndPoint = [nextX, nextY];

  // don't route to same tile
  if (currentStartPoint[0] === currentEndPoint[0] &&
    currentStartPoint[1] === currentEndPoint[1]) {
    return true;
  }

  // remove this robot
  robots.splice(robotID, 1);

  // check that each path does not intersect with proposed path
  var startPoint;
  var endPoint;
  // calculate current paths of all robots
  for (var i = 0; i < robots.length; i++) {
    startPoint = [robots[i].xPrev, robots[i].yPrev];
    endPoint = [robots[i].xAfter, robots[i].yAfter];
    console.log('robotID: ' + robotID
     + ' currentStartPoint: ' + currentStartPoint
     + ' currentEndPoint: ' + currentEndPoint
     + ' startPoint: ' + startPoint
     + ' endPoint: ' + endPoint);

    if (intersect(currentStartPoint[0], currentStartPoint[1],
       currentEndPoint[0], currentEndPoint[1],
       startPoint[0], startPoint[1],
       endPoint[0], endPoint[1])){
      // if same starting tile then don't collide
      if (!((currentStartPoint[0] === startPoint[0]) &&
        (currentStartPoint[1] === startPoint[1]))) {
        return true;
      }
    }
  }
  return false;
}

var intersect = function(x1, y1, x2, y2, x3, y3, x4, y4){
  var a_dx = x2 - x1;
  var a_dy = y2 - y1;
  var b_dx = x4 - x3;
  var b_dy = y4 - y3;
  var s = (-a_dy * (x1 - x3) + a_dx * (y1 - y3)) / (-b_dx * a_dy + a_dx * b_dy);
  var t = (+b_dx * (y1 - y3) - b_dy * (x1 - x3)) / (-b_dx * a_dy + a_dx * b_dy);
  return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
}

exports.move = move;
exports.setUp = setUp;
exports.removeTile = removeTile;

if (TEST) {
	exports.getRandomInt = getRandomInt;
	exports.uncheckedTiles = uncheckedTiles;
  exports.willCollide = willCollide;
}
