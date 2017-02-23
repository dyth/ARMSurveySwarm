var socket = io('localhost');

var startRobots = function(tileSize, gridSize) {
	socket.emit('startRobots', {tileSize: tileSize, gridSize:gridSize});
}

function displayError(msg) {

	$("#error-message").show();
	$("#error-message .text").text(msg);

}

$(function () {

	$("#inputForm").submit(function( event ) {

		var tileSize = $("#inputTileSize").val();
		var gridSize = $("#inputGridSize").val();

		if(tileSize == "" || gridSize == "") {
			displayError("Tile Size & Grid Size can not be left empty!");
			event.preventDefault();
			return false;
		}

		if(Number(tileSize) > Number(gridSize)){
			displayError("Tile Size can not be greater than Grid Size!");
			event.preventDefault();
			return false;
		}

		console.log("Starting");

		startRobots(tileSize, gridSize);

	});

});
