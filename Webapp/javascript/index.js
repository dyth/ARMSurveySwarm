var socket = io('localhost');

var startRobots = function(tileSize, gridSize, numRobots) {
	socket.emit('startRobots', {tileSize: tileSize, gridSize: gridSize, numRobots: numRobots});
}

function displayError(msg) {

	$("#error-message").show();
	$("#error-message .text").text(msg);

}

$(function () {

	$("#inputForm").submit(function( event ) {

		var tileSize = $("#inputTileSize").val();
		var gridSize = $("#inputGridSize").val();
		var numRobots = $("#inputRobots").val();

		if(tileSize == "") {
			displayError("Tile Size can not be left empty!");
			event.preventDefault();
			return false;
		}

		if(gridSize == "") {
			displayError("Grid Size can not be left empty!");
			event.preventDefault();
			return false;
		}

		if(numRobots == ""){
			displayError("Number of Robots can not be left empty!");
			event.preventDefault();
			return false;
		}

		if(Number(tileSize) > Number(gridSize)){
			displayError("Tile Size can not be greater than Grid Size!");
			event.preventDefault();
			return false;
		}

		console.log("Starting");

		startRobots(tileSize, gridSize, numRobots);

	});

});
