// delete existing tilesList
var processingTiles = [];
var initialState = [2,2,2,2,2,2];

// Robot - RobotID, CurrentPositionX, CurrentPositionY
// Tile - TileCoordinateX, TileCoordinateY, ColourDetected1
//        ColourDetected2, ColourDetected3, ColourDetected4, ColourDetected5, FinalColour

// create new tilesList
var createTilesList = function(nX, nY) {
  // set each tile to unknown = 2
  for(i = 0; i < nX; i++){
    var columns = [];
    for(j = 0; i < nY; j++) {
      columns[j] = initialState;
    }
    processingTiles[i] = columns;
  }
}

var getFinalTiles = function(processingTiles){
  // extract last element in each processingTiles[y][x] to create finalTiles
  var finalTiles = [];
  nX = processingTile.length;
  nY = processingTile[0].length;
  for(i = 0; i < nX; i++){
    var columns = [];
    for(j = 0; i < nY; j++) {
      columns[j] = processingTile[i][j][5];
    }
    finalTiles[i] = columns;
  }
  return finalTiles;
}

var move = function(robotID, coordX, coordY) {
  // update robot position in list
}

var setTile = function(robotID, lightIntensity) {
  // update tile table for current position

  // if two robots agree on colour, set finalColour,
  // if two robots disagree, delegate to go check

  // check for collisions with 4 other robots

  // if willCollide is true then change orientation
}

var reccheckTile = function(tileX, tileY){
  //pick random robot to check tile - or by which has least uncertainty
}

var willCollide = function(robot1, robot2) {
  // check current positions, return true if robots within given radius
}

var willCollideEdge = function(robotID) {
  // check that robots do not go out of bounds of the floor pattern

}
