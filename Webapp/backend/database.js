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
*
*
*/

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {

    if(err == null) {

        console.log("Connected successfully to server");

    }

});

function insertRobot(robotId) {



}

// Insert document
var insertDocuments = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.insertMany([
        {a : 1}, {a : 2}, {a : 3}
    ], function(err, result) {
        assert.equal(err, null);
        assert.equal(3, result.result.n);
        assert.equal(3, result.ops.length);
        console.log("Inserted 3 documents into the collection");
        callback(result);
    });
}

// Find Documents
var findDocuments = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs)
        callback(docs);
    });
}

var removeDocuments = function (db, callback) {

    var collection = db.collection('documents');
    collection.deleteMany({}, function (err, r) {
        console.log(r.deletedCount);
        callback();
    });

}

function dropCollection(db, callback) {
    if(db.collection('documents').drop())
        console.log("Dropped");
    callback();
}