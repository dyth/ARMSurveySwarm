/**
 * Created by Jamie on 07/02/2017.
 */

var DEFAULT_TILE_CONTENTS = 0;

// This is the ID of the currently selected robot on the UI
var currentlySelectedRobot;

// Empty, gets filled once the widths are all set
var tiles = [];

var states = [["Calibrating", "label label-warning"], ["Scanning", "label label-success"], ["Stopped", "label label-danger"]];

// Fill the robots array with some default values before
// anything is received. Could alternatively talk to
// server on connect to get this information.
var robots =(function() {
    var size = 5;
    var robots = [];
    var colours = ["#f44edc", "#0de181", "#5dc1de", "#7e40f8", "#b72d49"];

    for (var i = 0; i < size; i ++) {
        robots.push({id: i, x: 0, y: 0, status: 0, colour: colours[i]});
    }

    return robots;
})();
