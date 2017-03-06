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

    // Display info panel
    $(".info-btn").click(function () {

        // Extract the robot ID from the DOM
        var robotId = $(this).closest(".robot-row").data(KEY_ROBOT_ROW_DATA);
        displayRobotInfo(robotId);

    });

});