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

// unchecked tiles now split up the board into 4 quadrants.
// robots at corners numbering the quadrants will only be routed into those
// quadrants
var uncheckedTiles = [[],[],[],[]];
var numQuadrants = 4;

// Weights to get tile positions when quadrant is full
var escapeTilesX = [1/4, 1/2, 3/4, 1/2];
var escapeTilesY = [1/2, 3/4, 1/2, 1/4];

var tilesAcross = 0;

var setUp = function(length) {
  tilesAcross = length;
  uncheckedTiles[0].length = 0;
  uncheckedTiles[1].length = 0;
  uncheckedTiles[2].length = 0;
  uncheckedTiles[3].length = 0;

	for(var i = 0; i < tilesAcross; i++){
		for(var j = 0; j < tilesAcross; j++) {
      uncheckedTiles[getQuadrant(i, j)].push({xPos: i, yPos: j});
		}
	}
}

var getQuadrant = function(coordX, coordY) {
  if (coordX < Math.round(tilesAcross/2)) {

    if (coordY < Math.round(tilesAcross/2)) {
      return 0;
    } else {
      return 1;
    }

  } else {

    if (coordY < Math.round(tilesAcross/2)) {
      return 3;
    } else {
      return 2;
    }

  }
}

/*
* Remove tile from quadrant for given coordinates
*/
var removeTile = function(coordX, coordY) {
	var index = -1;
  var quadrantNo = getQuadrant(coordX, coordY);
	for (var i = 0; i < uncheckedTiles[quadrantNo].length; i ++) {
		if (uncheckedTiles[quadrantNo][i].xPos === coordX
				&& uncheckedTiles[quadrantNo][i].yPos === coordY) {
			index = i;
			break;
		}
	}

	if (index > -1) {
		uncheckedTiles[quadrantNo].splice(index, 1);
	}
}

/*
 * Returns random integer between min and max.
 */
var getRandomInt = function(min, max){
	return Math.floor((Math.random() * max) + min);
}

var allTilesCovered = function() {
  return (uncheckedTiles[0].length === 0 && uncheckedTiles[1].length === 0
    && uncheckedTiles[2].length === 0 && uncheckedTiles[3].length === 0);
}

/*
 * Choose tile to check next, return x and y positions.
 */
var move = function(robotID, quadrantNo) {
  if (allTilesCovered()){

    return {xAfter: -1, yAfter: -1, stopAll: true};

  } else if (uncheckedTiles[quadrantNo].length === 0) {

    // Covered all tiles in quadrant, move it to tile to just go to next corner
    return {xAfter: escapeTilesX*tilesAcross,
      yAfter: escapeTilesY*tilesAcross, stopAll: false};

  } else {

		var tileIndex = getRandomInt(0, uncheckedTiles[quadrantNo].length);
		var nextX = uncheckedTiles[quadrantNo][tileIndex].xPos;
		var nextY = uncheckedTiles[quadrantNo][tileIndex].yPos;

		return {xAfter: nextX, yAfter: nextY, stopAll: false};
	}
}

exports.move = move;
exports.setUp = setUp;
exports.removeTile = removeTile;

if (TEST) {
	exports.getRandomInt = getRandomInt;
	exports.uncheckedTiles = uncheckedTiles;
}
