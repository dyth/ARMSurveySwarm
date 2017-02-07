var socket = io('localhost');

var startRobots = function(tileSize) {
	socket.emit('startRobots', {size: tileSize});
}

$(function () {

	$("#inputForm").submit(function( event ) {

		var tileSize = $("#inputTileSize").val();

		startRobots(tileSize);


	});

});
