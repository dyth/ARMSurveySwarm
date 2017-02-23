/*
 * 16/02/2017
 * Kamile
 * Routing algorithm to calculate next destination,
 * avoiding collisions
 */
 var TEST = true;

// Each element is dictionary of x, y positions for unchecked tiles
var uncheckedTiles = [];

var setUp = function(tileNumber) {
	for(var i = 0; i < tileNumber; i++){
		for(var j = 0; j < tileNumber; j++) {
			uncheckedTiles.push({xPos: i, yPos: j});
		}
	}
}

var removeTile = function(coordX, coordY) {
  var index = uncheckedTiles.indexOf({xPos:coordX, yPos:coordY});
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
var move = function(robotID, startX, startY) {
	if (uncheckedTiles.length == 0) {
		// Covered all tiles?
		return {xAfter: -1, yAfter: -1, stopAll: true}
	} else {
		var tileIndex = getRandomInt(0, uncheckedTiles.length);
		var nextX = uncheckedTiles[tileIndex].xPos;
		var nextY = uncheckedTiles[tileIndex].yPos;
		return {xAfter: nextX, yAfter: nextY, stopAll: false};
	}
}
exports.move = move;
exports.setUp = setUp;
exports.removeTile = removeTile;
