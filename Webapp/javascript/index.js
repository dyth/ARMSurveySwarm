var socket = io('localhost');

var sendTileSize = function(tileSize) {
	socket.io.emit('sendTileSize', {size: tileSize});
}

$(function () {

	$("#inputForm").submit(function( event ) {

		var tileSize = $("#inputTileSize").val();

		sendTileSize(tileSize);

		event.preventDefault();
	});

});
