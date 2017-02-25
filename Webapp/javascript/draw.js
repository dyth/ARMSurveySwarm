/*
*
* draw.js
* Handles drawing to the UI
*
 */

var canvas;
var stage;
var graph;

var robotSprites = [];

function setupDraw () {

    console.log("Setup Draw");

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

    // Create the robot sprites and add robot HTML
    for(var i = 0; i < robots.length; i++){
        addRobotSprite(i);
        addRobotHTML(i);
    }

}

/*
*
* Adds a robot sprite of the correct colour to the sprites array and adds it to the graph.
*
 */
function addRobotSprite(robotID) {
    var shape = new createjs.Shape();
    shape.graphics.beginFill(robots[robotID].colour).drawCircle(0, 0, 10);
    robotSprites.push(shape);
    stage.addChild(shape);
}

/*
*
* Adds robot to HTML and colour codes the names
* 
 */
function addRobotHTML(robotID) {

    var newRow = $('<div class="row robot-row"></div>');
    newRow.prepend('<div class="col-xs-12"><span class="name">Robot '+(robotID + 1)+'</span> <span class="label label-warning">Calibrating</span> <a href="#info-section" class="btn btn-xs btn-default info-btn">i</a></div>');
    newRow.data(KEY_ROBOT_ROW_DATA, robotID);
    $("#robot-list").append(newRow);

    // Colour code the name
    var name = newRow.find("span.name");
    name.css("color", robots[robotID].colour);

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

    //console.log("Updating Canvas");

    /*
     *   Graph Representation
     *
     *   [3,0] [3,1] [3,2] [3,3]
     *   [2,0] [2,1] [2,2] [2,3]
     *   [1,0] [1,1] [1,2] [1,3]
     *   [0,0] [0,1] [0,2] [0,3]
     *
     */

    graph.graphics.clear();

    // Calculate square size
    var size = canvas.width() / tiles.length;
    //console.log("Size: " + size);

    // Draw squares
    for(var i = 0; i<tiles.length; i++){

        for(var j = 0; j<tiles.length; j++){

            var graphics;

            if(tiles[i][j] == 1)
                graphics = graph.graphics.beginFill("#000");
            else if(tiles[i][j] == 0)
                graphics = graph.graphics.beginFill("#fff");
            else
                graphics = graph.graphics.beginFill("#ccc");

            graphics.drawRect(j*size, ( tiles.length - i - 1 ) * size, size, size);

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
    robotSprite.y = (tiles.length - robot.y - 0.5) * size;

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

    var btn = container.find("#stop-start-btn");



    if(robot.status == 2){
        btn.text("Start");
        btn.attr("class", "btn btn-success");
    }
    else{
        btn.text("Stop");
        btn.attr("class", "btn btn-danger");
    }

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

/*
*
* Returns a random colour for colour coding robots.
*
 */
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}