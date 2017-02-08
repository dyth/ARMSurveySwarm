/**
 * Created by Jamie on 06/02/2017.
 */

var canvas;
var stage;
var graph;

$(function () {

    // Get references to the canvas and a new stage
    canvas = $("#canvas");
    stage = new createjs.Stage("canvas");

    // Resize the canvas to fill the entire width
    resizeCanvas();

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

// TODO: Do this
function updateState(robotId) {

}