// Retrieve
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connect to db on port 27017
var url = 'mongodb://localhost:27017/NovemberDB';
MongoClient.connect(url, function(err, db){
  assert.equal(null, err);
  console.log("Connected to server correctly. ");
  insertDocuments(db, function(){
    updateDocument(db, function(){
      deleteDocument(db, function(){
        findDocuments(db, function(){
          db.close();
        });
      });
    });
  });
});

// Collections = Tables
var insertDocuments = function(db, callback) {
  //Get documents Collection
  var collection = db.collection('documents');
  var tilesTable = db.collection('tiles');
  var robotTable = db.collection('robot');

  // delete existing tilesTable

  // create new table with tile dimensions given by user

  // set each tile to unknown


  // insert some documents
  collection.insertMany([
    {a:1}, {a:2}, {a:3}], function (err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n); //result doc from MongoDB
    assert.equal(3, result.ops.length); //doc inserted with added _id fields
    console.log("Inserted 3 documents into the document collection");
    callback(result);
  });
}

var updateDocument = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Update document where a is 2, set b equal to 1
  collection.updateOne({ a : 2 }
    , { $set: { b : 1 } }, function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Updated the document with the field a equal to 2");
    callback(result);
  });
}

//Delete document
var deleteDocument = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents

  collection.deleteOne({ a : 3 }, function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Removed the document with the field a equal to 3");
    callback(result);
  });
}

// Query collections, return all docs matching query.
var findDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    //assert.equal(2, docs.length);
    console.log("Found the following records");
    console.dir(docs);
    callback(docs);
  });
}
