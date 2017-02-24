/*
 * 16/02/2017
 * Kamile
 * Routing algorithm to calculate next destination,
 * avoiding collisions
 */
var TEST = true;

// Each element is dictionary of x, y positions for unchecked tiles
this.uncheckedTiles = [];

var setUp = function(tileNumber) {
	this.uncheckedTiles = [];
	for(var i = 0; i < tileNumber; i++){
		for(var j = 0; j < tileNumber; j++) {
			this.uncheckedTiles.push({xPos: i, yPos: j});
		}
	}
	removeTile(0,0); //remove starter Tile - all robots will scan at start
}

var removeTile = function(coordX, coordY) {
	var index = this.uncheckedTiles.indexOf({xPos:coordX, yPos:coordY});
	if (index > -1) {
		this.uncheckedTiles.splice(index, 1);
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
	if (this.uncheckedTiles.length == 0) {
		// Covered all tiles?
		return {xAfter: -1, yAfter: -1, stopAll: true}
	} else {
		var tileIndex = getRandomInt(0, this.uncheckedTiles.length);
		var nextX = this.uncheckedTiles[tileIndex].xPos;
		var nextY = this.uncheckedTiles[tileIndex].yPos;
		return {xAfter: nextX, yAfter: nextY, stopAll: false};
	}
}
exports.move = move;
exports.setUp = setUp;
exports.removeTile = removeTile;

if (TEST) {
	exports.getRandomInt = getRandomInt;
	exports.uncheckedTiles = this.uncheckedTiles;
}
