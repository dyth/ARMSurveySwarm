var socket = io('localhost');

var startRobots = function(tileSize, gridSize) {
	socket.emit('startRobots', {tileSize: tileSize, gridSize:gridSize});
}

$(function () {

	$("#inputForm").submit(function( event ) {

		var tileSize = $("#inputTileSize").val();
		var gridSize = $("#inputGridSize").val();

		startRobots(tileSize, gridSize);

	});

});
