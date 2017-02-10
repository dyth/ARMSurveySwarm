/**
 * Created by Jamie on 09/02/2017.
 */


$(function () {

    // Call stop in connnection.js
    $("#stop-btn").click(function () {
        stopAll();
    });

    // Display info panel
    $(".info-btn").click(function () {

        var robotId = $(this).data("robot-id");
        displayRobotInfo(robotId);

    });

});