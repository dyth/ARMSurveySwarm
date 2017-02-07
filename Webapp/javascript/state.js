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

// Fill the robots array with some default values before
// anything is received. Could alternatively talk to
// server on connect to get this information.
var robots =(function() {
    var size = 5;
    var robots = [];

    for (var i = 0; i < size; i ++) {
        robots.push({id: i, status: 'disconnected'});
    }

    return robots;
})();

var getRobotByID = function(id) {
    for (var i = 0; i < robots.length; i ++) {
        if (robots[i].id === id) {
            return robots[i];
        }
    }

    throw "Unknown robot " + id.toString();
};

var setRobotByID = function(robot, id) {
    for (var i = 0; i < robots.length; i ++) {
        if (robots[i].id === id) {
            robots[i] = robot;
            return;
        }
    }

    throw "Unknown robot " + id.toString();
};