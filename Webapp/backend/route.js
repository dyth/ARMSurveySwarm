/*
* 16/02/2017
* Kamile
* Routing algorithm to calculate next destination,
* avoiding collisions
*/

// Each element is dictionary of x, y positions for unchecked tiles
var uncheckedTiles = [];

var setUp = function(tileNumber) {
  for(var i = 0; i < tileNumber; i++){
    for(var j = 0; j < tileNumber; j++) {
      uncheckedTiles.push({xPos: i, yPos: j});
    }
  }
}

/*
* return random integer between min and max.
*/
var getRandomInt = function(min, max){
  return Math.floor((Math.random() * max) + min);
}

var move = function(robotID, startX, startY) {
  if (uncheckedTiles.length == 0) {
    // Covered all tiles?
    // Trying to setup testing framework
    return {xAfter: 0, yAfter: 0};
  } else {
    var tileIndex = getRandomInt(0, uncheckedTile.length);
    var nextX = uncheckedTile[tileIndex].xPos;
    var nextY = uncheckedTile[tileIndex].yPos;

    // Remove this tile from uncheckedTiles so that no other robotID
    // is routed to it.
    uncheckedTiles.splice(tileIndex,1);

   return {xAfter: nextX, yAfter: nextY};
  }
}

exports.move = move;
exports.setUp = setUp;
