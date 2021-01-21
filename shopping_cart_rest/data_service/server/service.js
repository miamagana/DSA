const express = require("express");

const service = express();

const mongoclient = require("mongodb").MongoClient;
const assert = require("assert");

module.exports = (config) => {
  const url = "mongodb://localhost:27017";

  const insertDocuments = function (db, callback) {
    // Initialize DB dropping collections
    db.collection("products").drop();
    db.collection("cart").drop();

    // Create an empty cart
    db.collection("cart").insertOne(
      { id: 0, items: [] },
      function (err, result) {
        assert.strictEqual(err, null);
        assert.strictEqual(1, result.result.n);
        assert.strictEqual(1, result.ops.length);
        console.log("Created cart");
        callback(result);
      }
    );
    db.collection("products").insertMany(
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
      const db = client.db("almacen");
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
      const db = client.db("almacen");
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

  service.get("/cart", (req, res) => {
    mongoclient.connect(url, function (err, client) {
      assert.strictEqual(null, err);
      const db = client.db("almacen");
      db.collection("cart").findOne(function (err, cart) {
        if (err) throw err;
        res.status(200);
        client.close();
        return res.json(cart);
      });
    });
  });

  // Create or update a cart
  service.put("/cart/:item/:quantity", async (req, res) => {
    let { item, quantity } = req.params;
    quantity = Number(quantity);
    try {
      mongoclient.connect(url, async (err, client) => {
        assert.strictEqual(null, err);
        const db = client.db("almacen");
        db.collection("products")
          .find()
          .toArray(async (err, items) => {
            if (err) throw err;
            const exists = items.find((it) => it.desc === item);
            //check if item exists else return 404
            if (!exists) {
              res.status(404);
              res.json(`Item ${item} does not exist`);
              return res;
            }
            //check if there is stock else return 400
            if (!isAvailable(exists, quantity)) {
              res.status(400);
              res.json(`Not enough stock for ${item}`);
              return res;
            }
            const cart = await getCart(db);
            let updatedItems = cart.items;
            let itemInCart = updatedItems.find((it) => it.cod === exists.cod);
            if (!!itemInCart) {
              const newQuantity = itemInCart.quantity + quantity;
              itemInCart.quantity = newQuantity;
            } else {
              let { stock, ...newItem } = exists;
              newItem.quantity = quantity;
              updatedItems.push(newItem);
            }
            const newCart = await updateCart(db, updatedItems);
            res.status(200);
            client.close();
            return res.json(newCart);
          });
      });
    } catch (error) {
      res.status(500);
      res.json(error);
    }
  });

  const isAvailable = (item, qty) => {
    const { stock } = item;
    return stock >= qty;
  };

  const getCart = async (db) => {
    return await db.collection("cart").findOne({ id: 0 });
  };

  const updateCart = async (db, newItems) => {
    try {
      const newCart = await db.collection("cart").findOneAndUpdate(
        { id: 0 },
        {
          $set: {
            items: newItems,
          },
        },
        { returnOriginal: false }
      );
      console.log(
        `Successfully updated cart: ${JSON.stringify(newCart.value)}`
      );
      return newCart.value;
    } catch (error) {
      console.error(`Failed to find and update cart: ${error}`);
    }
  };

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
