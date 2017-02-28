/*
 * state.js
 * Stores state for the run page which needs to be accessed across multiple javascript files.
 *
 */

var DEFAULT_TILE_CONTENTS = 0;

// The number of robots being used
var numRobots;

// This is the ID of the currently selected robot on the UI
var currentlySelectedRobot;

// Empty, gets filled once the widths are all set
var tiles = [];

var states = [["Calibrating", "label label-warning"], ["Scanning", "label label-success"], ["Stopped", "label label-danger"], ["Disconnected", "label label-danger"], ["Recalibrate", "label label-danger"]];

// Fill the robots array with some default values before
// anything is received. Could alternatively talk to
// server on connect to get this information.
var robots;

/*
*
* Setup the state
* Called in onCreate in run.js
*
 */
function setupState() {

    console.log("Setup State");

    robots = (function() {
        var robots = [];

        for (var i = 0; i < numRobots; i ++) {
            robots.push({id: i, x: 0, y: 0, status: 0, colour: getRandomColor()});
        }

        return robots;
    })();

}
