var socket = io('localhost');

var sendTileSize = function(tileSize) {
	sockets.io.emit('sendTileSize', {size: tileSize});
}
