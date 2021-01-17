const mongoclient = require('mongodb').MongoClient;
var assert = require('assert');

var url='mongodb://mongodb:27017';

const insertDocuments = function (db, callback) {
  // Get the documents collection
  var collection = db.collection('products');
  // Insert some documents
  collection.insertMany([
    {cod : 1,desc:'palos',stock:0}, {cod : 2,desc:'hierros',stock:10}, {cod : 3,desc:'muelles',stock:5}
  ], function(err, result) {
    assert.strictEqual(err, null);
    assert.strictEqual(3, result.result.n);
    assert.strictEqual(3, result.ops.length);
    console.log("Inserted 3 products into the collection");
    callback(result);
  });
}

mongoclient.connect(url, function(err, client) {
  assert.strictEqual(null, err);
  console.log("Connected successfully to server");
  const db = client.db('almacen');
  insertDocuments(db,function() {
        	if (err) throw err;
        	console.log('success with insertion!');
          client.close();
  });
});

