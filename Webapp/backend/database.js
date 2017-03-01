/**
 * Created by Jamie on 28/02/2017.
 */

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

// Database URL
var url = 'mongodb://localhost:27017/SurveySwarm';

/*
*
* Schema
*
* Tiles<Collection>
*     Coordinates
*     Intensity
*     Timestamp
*
* Robots<Collection>
*     Position
*     RobotId
*     Status
*
*
*/

MongoClient.connect(url, function(err, db) {

    if(err == null) {

        console.log("Connected successfully to server");

        /*upsertRobot(db, {id: 2, x: 0, y: 0, status: 0}, function () {

            db.close();

        });*/

        /*getRobotById(db, 0, function () {

            db.close();

        });*/

        /*insertTileData(db, 5, 3, 1, 0, function () {

            db.close();

        });*/

        getAllLatestTiles(db, function () {

            db.close();

        });

    }

});


/*
*
* upsertRobot(db, robot, callback)
*
* Inserts a robot to the database or updates one if it already exists.
*
* db: An instance to the database
* robot: Data to store of the form {id: , x: , y: , status: }
* callback: Function to call when the upsert has finished.
*
 */
//TODO: Return error status in callback / return
function upsertRobot(db, robot, callback) {

    // Get the robots collection
    var collection = db.collection('robots');

    // Insert the robot
    collection.updateOne({id:robot.id}, robot, {upsert: true}, function (err, res) {

        console.log(res.upsertedCount);
        console.log(res.matchedCount);

        callback();

    });

}


/*
*
* getAllRobots(db, callback)
* db: An instance to the database
* callback: Function to call when the find has finished.
*
 */
// TODO: Pass all robots to the callback / return robots
function getAllRobots(db, callback){

    // Get the robots collection
    var collection = db.collection('robots');

    // Read all the robots
    collection.find({}).toArray(function (err, docs) {

        console.log(docs);

        callback();

    });


}


/*
*
* getRobotById(db, id, callback)
*
* db: An instance to the database
* id: The robot id to search for
* callback: Function to call when the find has finished.
*
*
 */
// TODO: Return the robot if one exists
function getRobotById(db, id, callback) {

    // Get the robots collection
    var collection = db.collection('robots');

    // Read all the robots
    collection.find({id: id}).toArray(function (err, docs) {

        console.log(docs);

        callback();

    });


}

/*
*
* insertTileData(db, x, y, intensity, robotId, callback)
*
* Inserts a new tile into the document
*
 */
// TODO: Return error data
function insertTileData(db, x, y, intensity, robotId, callback) {

    // Get the tiles collection
    var collection = db.collection('tiles');

    // Get the timestamp
    var t = Date.now();

    // Add the tiledata
    collection.insertOne({x: x, y: y, intensity: intensity, robotId: robotId, timestamp: t}, function (err, res) {

        console.log(res.insertedCount);

        callback();
    });

}

/*
*
* getAllTiles(db, callback)
*
* Returns all tiles in the document
*
*
 */
function getAllTiles(db, callback) {

    // Get the tiles collection
    var collection = db.collection('tiles');

    collection.find({}).toArray(function (err, docs) {

        console.log(docs);

        callback();

    });

}

/*
*
*
*
 */
function getAllLatestTiles(db, callback){

    // Get the tiles collection
    var collection = db.collection('tiles');

    collection.find({}).sort({timestamp: -1}).toArray(function (err, docs) {

        console.log(docs);

        callback();

    });

}





