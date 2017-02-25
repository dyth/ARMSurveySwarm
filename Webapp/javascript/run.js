/**
 * Created by Jamie on 09/02/2017.
 */


$(function () {

    // Get number of robots
    numRobots = sessionStorage.getItem("numRobots");

    // Perform all module setup
    setupState();
    setupDraw();

    // Call stop in connnection.js
    $("#stop-btn").click(function () {
        stopAll();
    });

    // Display info panel
    $(".info-btn").click(function () {

        // Extract the robot ID from the DOM
        var robotId = $(this).closest(".robot-row").data("robot-id");
        displayRobotInfo(robotId);

    });

    $("#stop-start-btn").click(function () {

        var robot = robots[currentlySelectedRobot];

        if(robot.status == 2) // If(Robot is Stopped)
            resume(currentlySelectedRobot);
        else // Robot is running
            stop(currentlySelectedRobot);

    });

});