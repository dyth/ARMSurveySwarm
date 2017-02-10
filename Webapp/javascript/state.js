/**
 * Created by Jamie on 07/02/2017.
 */

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

var states = [["Calibrating", "label label-warning"], ["Scanning", "label label-success"], ["Stopped", "label label-danger"]]

// Fill the robots array with some default values before
// anything is received. Could alternatively talk to
// server on connect to get this information.
var robots =(function() {
    var size = 5;
    var robots = [];

    for (var i = 0; i < size; i ++) {
        robots.push({id: i, status: 0});
    }

    return robots;
})();