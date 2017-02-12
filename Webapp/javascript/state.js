/**
 * Created by Jamie on 07/02/2017.
 */

var DEFAULT_TILE_CONTENTS = 0;

// Empty, gets filled once the widths are all set
var tiles = [];

var states = [["Calibrating", "label label-warning"], ["Scanning", "label label-success"], ["Stopped", "label label-danger"]]

// Fill the robots array with some default values before
// anything is received. Could alternatively talk to
// server on connect to get this information.
var robots =(function() {
    var size = 5;
    var robots = [];

    for (var i = 0; i < size; i ++) {
        robots.push({id: i, x: 0, y: 0, status: 0});
    }

    return robots;
})();
