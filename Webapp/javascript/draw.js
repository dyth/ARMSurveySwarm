/**
 * Created by Jamie on 06/02/2017.
 */

var canvas;
var stage;
var graph;

// TODO: Replace with actual tile data
var tiles = [
    [1,0,0,1,0,1,0],
    [0,1,0,0,0,1,1],
    [1,1,0,1,1,1,0],
    [0,1,1,0,0,0,0],
    [1,0,1,0,1,1,0],
    [0,1,1,0,0,1,1],
    [0,0,1,0,0,1,0]
];

// Fill the robots array with some default values before
// anything is received. Could alternatively talk to
// server on connect to get this information.
var robots =(function() {
	var size = 5;
	var robots = [];

	for (var i = 0; i < size; i ++) {
		robots.push({id: i, status: 'disconnected'});
	}

	return robots;
})();

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

    canvas.width(size);
    canvas.height(size);

}

function updateCanvas() {

    // Clear the stage
    stage.clear();

    // Calculate square size
    var size = canvas.width() / tiles.length;

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
