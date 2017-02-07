// delete existing tilesList
var processingTiles;
var finalTiles;

// create new tilesList
var createTilesList = function(tileX, tileY) {
  // set each tile to unknown
}

var createFinalTiles = function(processingTiles){
  // extract last element in each processingTiles[y][x] to create finalTiles
}

var move = function(robotID, coordX, coordY) {
  // update robot position in list
}

var setTile = function(robotID, lightIntensity) {
  // update tile table for current position

  // check for collisions with 4 other robots

  // if willCollide is true then change orientation

}

var willCollide = function(robot1, robot2) {
  // check current positions, return true if robots within given radius

}
