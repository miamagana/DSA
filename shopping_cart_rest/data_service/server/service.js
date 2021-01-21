const express = require("express");

const service = express();

const mongoclient = require("mongodb").MongoClient;
const assert = require("assert");

module.exports = (config) => {
  const url = "mongodb://localhost:27017";
  let collection;
  let db;

  const insertDocuments = function (db, callback) {
    db.collection("products").drop();
    // Get the documents collection
    collection = db.collection("products");
    // Insert some documents
    collection.insertMany(
      [
        { cod: 1, desc: "palos", stock: 0 },
        { cod: 2, desc: "hierros", stock: 10 },
        { cod: 3, desc: "muelles", stock: 5 },
      ],
      function (err, result) {
        assert.strictEqual(err, null);
        assert.strictEqual(3, result.result.n);
        assert.strictEqual(3, result.ops.length);
        console.log("Inserted 3 products into the collection");
        callback(result);
      }
    );
  };

  const init = () =>
    mongoclient.connect(url, function (err, client) {
      assert.strictEqual(null, err);
      console.log("Connected successfully to DB");
      db = client.db("almacen");
      insertDocuments(db, function () {
        if (err) throw err;
        console.log("success with insertion!");
        client.close();
      });
    });
  const log = config.log();
  // Add a request logging middleware in development mode
  if (service.get("env") === "development") {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`);
      return next();
    });
  }

  init();

  service.get("/items", (req, res) => {
    mongoclient.connect(url, function (err, client) {
      assert.strictEqual(null, err);
      db = client.db("almacen");
      db.collection("products")
        .find()
        .toArray(function (err, items) {
          if (err) throw err;
          res.status(200);
          client.close();
          return res.json(items);
        });
    });
  });

  // eslint-disable-next-line no-unused-vars
  service.use((error, req, res, next) => {
    res.status(error.status || 500);
    // Log out the error to the console
    log.error(error);
    return res.json({
      error: {
        message: error.message,
      },
    });
  });
  return service;
};
