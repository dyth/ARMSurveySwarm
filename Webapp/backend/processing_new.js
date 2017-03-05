/**
 * Created by Jamie on 05/03/2017.
 */

var server = require('./server');
var communication = require('./communication');
var route = require('./route');

var robots = [];

var tiles = [];

var gridSize;
var tileSize;

var startedProcessing = false;

var connectedRobots = 0;
var waitingRobots = 0;

var initTiles = function () {

    for(var i = 0; i < gridSize; i++){
        tiles[i] = [];
        for(var j = 0; j < gridSize; j++){
            tiles[i][j] = {accepted: 2, black: 0, white: 0};
        }
    }

};

/*
 * Adds a robot to the list
 * Called in communication.js
 */
var addRobotToList = function(robotID) {

    // Quadrants are numbered 0 - 3 starting from the bottom left-hand corner
    // xCorner/yCorner will be out of bounds of the tiles array since we will not
    // always be in the bottom left hand corner now

    // TODO: Don't ignore reconnecting robots
    // Move all other robots to next corner
    for(var i = 0; i < robots.length; i++){
        if(robots[i] !== undefined)
            moveToNextCorner(i);
    }

    robots[robotID] = {xDest: 0, yDest: 0, corner: 0, robotStatus: 0};

    connectedRobots++;

    console.log(robots);

};

var robotConnectionLost = function(robotID) {
    // Set the robot status to calibrating again.
    console.log("CONNECTION LOST");
    robots[robotID].robotStatus = 2;

    sendStatusUpdate(robotID);

    // Decrease the connected robots
    connectedRobots--;
};


var setTileSize = function(s) {
    tileSize = s;
};

var setGridDimensions = function(s) {
    gridSize = s;
    initTiles();
};

var getGridSize = function() {
    return gridSize;
};

var startProcessing = function() {
    startedProcessing = true;
    route.setUp(gridSize);

    for (var i = 0; i < robots.length; i ++) {
        // This sends the start message to the robots.
        if (robots[i] !== undefined) {

            communication.sendStart(i, tileSize);
            nextMove(i);

        }
    }
};

var moveToNextCorner = function (robotId) {

    communication.sendNextCorner(robotId);
    robots[robotId].corner = (robots[robotId].corner + 1) % 4;

};

var nextMove = function (robotId) {

    waitingRobots++;

    if(waitingRobots === connectedRobots){

        // Give each robot a new instruction
        for(var id = 0; id < robots.length; id++){

            var robot = robots[id];

            if(robot === undefined) continue;

            // Calculate the next move
            var startCorner = cornerToCoordinates(robot.corner);
            var next = route.move(startCorner.x, startCorner.y);

            if(next.stopAll){

                communication.sendStop(id);
                setRobotStatusStopped(id);

            }
            else{

                robot.xDest = next.xAfter;
                robot.yDest = next.yAfter;

                var instructions = convertToRobotInstructions(startCorner.x, startCorner.y, robot.xDest, robot.yDest, robot.corner);

                communication.sendMove(id, radToDeg(instructions.angle), instructions.distance);
                setRobotStatusScanning(id);

                console.log('('+startCorner.x+','+startCorner.y+') -> ('+robot.xDest+','+robot.yDest+') with angle '+radToDeg(instructions.angle)+' and distance '+instructions.distance)

            }

        }

        waitingRobots = 0;

    }
    else {
        setRobotStatusWaiting(robotId);
    }

};

var handleDone = function(robotId, intensities){

    var robot = robots[robotId];

    // Calculate the start position
    var startCorner = cornerToCoordinates(robot.corner);

    // Working variables
    var x = startCorner.x;
    var y = startCorner.y;


    var deltaX = (robot.xDest - startCorner.x) / intensities.length;
    var deltaY = (robot.yDest - startCorner.y) / intensities.length;

    for(var i = 0; i < intensities.length; i++){

        x += deltaX;
        y += deltaY;

        var intensity = intensities[i];

        var xCoord = Math.floor(x);
        var yCoord = Math.floor(y);

        if(intensity < 400){
            tiles[xCoord][yCoord].white++;
        }
        else if(intensity > 600) {
            tiles[xCoord][yCoord].black++;
        }

        updateTile(xCoord, yCoord);

    }

    // Update the robot state
    robot.corner = (robot.corner + 1) % 4;

};

var updateTile = function (x, y) {

    var tile = tiles[x][y];

    if(tile.white > tile.black){
        tile.accepted = 1;
    }
    else if(tile.black > tile.white){
        tile.accepted = 0;
    }
    else {
        tile.accepted = 2;
    }

    server.updateTile(x, y, tile.accepted);

};

/* Math Functions */
var cornerToCoordinates = function (corner) {

    if(corner === 0) return {x:0, y:0};
    if(corner === 1) return {x:0, y:gridSize-1};
    if(corner === 2) return {x:gridSize-1, y:gridSize-1};
    if(corner === 3) return {x:gridSize-1, y:0};

};

var convertToRobotInstructions = function(startX, startY, endX, endY, corner){

    var deltaX = Math.abs(endX - startX);
    var deltaY = Math.abs(endY - startY);

    var angle;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if(corner % 2 === 0) angle = Math.atan(deltaX / deltaY);
    else angle = Math.atan(deltaY / deltaX);

    return {angle: angle, distance: distance * tileSize};

};

var radToDeg = function (rad) {
    return rad * 180 / Math.PI;
};

/*
 * This unpacks the dictionary for the robot status and sends it on to the
 * server
 */
var sendStatusUpdate = function(robotID) {
    var robot = robots[robotID];
    server.updateStatus(robotID, robot.xAfter, robot.yAfter, robot.robotStatus);
};

var setRobotStatusStopped = function(robotID) {
    robots[robotID].robotStatus = 2;

    sendStatusUpdate(robotID);
};

var setRobotStatusScanning = function(robotID) {
    robots[robotID].robotStatus = 1;

    sendStatusUpdate(robotID);
};

var setRobotStatusWaiting = function(robotID) {
    robots[robotID].robotStatus = 0;

    sendStatusUpdate(robotID);
};


/* Exports */
exports.addRobotToList = addRobotToList;
exports.robotConnectionLost = robotConnectionLost;
exports.setTileSize = setTileSize;
exports.setGridDimensions = setGridDimensions;
exports.getGridSize = getGridSize;
exports.startProcessing = startProcessing;
exports.nextMove = nextMove;
exports.handleDone = handleDone;