/**
 * Created by Jamie on 06/02/2017.
 */

var canvas;
var stage;
var graph;

var robotSprites = [];

$(function () {

    // Get references to the canvas and a new stage
    canvas = $("#canvas");
    stage = new createjs.Stage("canvas");

    // Resize the canvas to fill the entire width
    resizeCanvas();

    // Automatically resize canvas
    $(window).resize(function () {
        resizeCanvas();
    });

    // Create a new graph shape
    graph = new createjs.Shape();

    // Add the graph to the stage
    stage.addChild(graph);

    // Create the robot sprites
    for(var i = 0; i < robots.length; i++){
        var shape = new createjs.Shape();
        shape.graphics.beginFill(robots[i].colour).drawCircle(0, 0, 10);
        robotSprites.push(shape);
        stage.addChild(shape);
        colourCodeName(i);
    }

});

/*
*
* Colour codes the robot name to match that of the robot.
* This way you can see the which robot marker on the graph corresponds to each robot.
*
 */
function colourCodeName(robotId){

    var robotSection = $(".robot-row")[robotId];
    var name = $(robotSection).find("span.name");

    name.css("color", robots[robotId].colour);

}

/*
*
* Resizes the canvas to fill the width of its container and ensures the canvas is square.
* Should be called whenever the tiles data changes or the size of tiles changes.
*
 */
function resizeCanvas(){

    var size = canvas.parent().width();

    canvas.attr("width", size);
    canvas.attr("height", size);

}

/*
*
* Update the canvas with the current tile data.
* Updated whenever the document resizes.
*
 */
function updateCanvas() {

    console.log("Updating Canvas");

    graph.graphics.clear();

    // Calculate square size
    var size = canvas.width() / tiles.length;
    console.log("Size: " + size);

    // Draw squares
    for(var i = 0; i<tiles.length; i++){

        for(var j = 0; j<tiles.length; j++){

            if(tiles[i][j] == 1)
                graph.graphics.beginFill("#000").drawRect(j*size, i*size, size, size);
            else
                graph.graphics.beginFill("#fff").drawRect(j*size, i*size, size, size);

        }

    }

    stage.update();

}

/*
*
* Updates the state label of a particular robot.
* Should be called whenever the state of a robot is changed.
*
 */
function updateState(robotId) {

    var robot = robots[robotId];

    // Find the specific row to update
    var robotSection = $(".robot-row")[robotId];
    var row = $(robotSection).find("span.label");

    // Update the row to display the correct state
    row.text(states[robot.status][0]);
    row.attr("class", states[robot.status][1]);

}

/*
*
* Updates the position of the robot marker on the graph.
* Should be called whenever the robot x and y are updated.
*
 */
function updateRobotPosition(robotID) {

    var robotSprite = robotSprites[robotID];
    var robot = robots[robotID];

    var size = canvas.width() / tiles.length;

    // Position the robot sprites at the center of the correct square
    robotSprite.x = (robot.x + 0.5) * size;
    robotSprite.y = (robot.y + 0.5) * size;

    updateCanvas();

}

/*
*
* Displays the robot information panel on the UI.
*
 */
function displayRobotInfo(robotId) {

    var container = $("#info-section");

    var robot = robots[robotId];

    // Update the fields
    container.find("h1").text("Robot " + (robotId + 1));
    container.find("#status").text(states[robot.status][0]);
    container.find("#x-position").text(robot.x);
    container.find("#y-position").text(robot.y);

    // Show the container
    container.show();

    // Update the currently selected robot
    currentlySelectedRobot = robotId;

    // TODO: CHANGE STOP BTN TO START BTN DEPENDING ON STATE

}

/*
*
* Refreshes the panel for the currently selected robot.
* Called when state changes or position changes.
*
 */
function updateRobotInfo() {

    if(currentlySelectedRobot != null)
        displayRobotInfo(currentlySelectedRobot);

}