/*
*
* run.js
* Performs setup for the run page.
* Handles input from run.html
*
 */


$(function () {

    // Get number of robots
    numRobots = sessionStorage.getItem(KEY_NUM_ROBOTS);
    console.log(numRobots);

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
        var robotId = $(this).closest(".robot-row").data(KEY_ROBOT_ROW_DATA);
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