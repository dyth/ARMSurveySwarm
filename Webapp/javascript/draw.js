/**
 * Created by Jamie on 06/02/2017.
 */

var canvas;
var stage;
var graph;

// TODO: WRITE TESTS
// TODO: DRAW ROBOTS ON CANVAS

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

});

function resizeCanvas(){

    var size = canvas.parent().width();

    canvas.attr("width", size);
    canvas.attr("height", size);

}

function updateCanvas() {

    console.log("Updating Canvas");

    // Clear the stage
    stage.clear();

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

function updateState(robotId) {

    var robot = robots[robotId];

    var row = $("#robot-" + robotId);
    row.text(states[robot.status][0]);
    row.attr("class", states[robot.status][1]);

}

function displayRobotInfo(robotId) {

    var container = $("#info-section");

    var robot = robots[robotId];

    // Update the fields
    container.find("h1").text("Robot " + (robotId + 1));
    container.find("#status").text(states[robot.status][0]);

    // Show the container
    container.show();


}