const express = require("express");
const mongoose = require("mongoose");
const url = "mongodb://localhost:27017/almacen";
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
const service = express();

module.exports = (config) => {
  const log = config.log();
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", async () => {
    await init();
  });

  const productSchema = new mongoose.Schema({
    cod: Number,
    desc: String,
    stock: Number,
  });

  const cartSchema = new mongoose.Schema({
    id: Number,
    items: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  });

  const Products = mongoose.model("products", productSchema);
  const Cart = mongoose.model("cart", cartSchema);

  const insertDocuments = async () => {
    // Initialize DB dropping collections
    await Products.deleteMany();
    await Cart.deleteMany();

    // Create an empty cart
    await Cart.create({ id: 0 });
    await Products.create([
      { cod: 1, desc: "palos", stock: 0 },
      { cod: 2, desc: "hierros", stock: 10 },
      { cod: 3, desc: "muelles", stock: 5 },
    ]);
  };

  const init = async () => {
    try {
      await insertDocuments();
    } catch (error) {
      log.error(`Error while trying to initialize DB: ${error}`);
    }
  };

  service.get("/items", async (req, res) => {
    try {
      const items = await Products.find().exec();
      res.status(200);
      return res.json(items);
    } catch (error) {
      res.status(500);
      return res.json(error);
    }
  });

  service.get("/cart", async (req, res) => {
    try {
      const response = await Cart.findOne().exec();
      res.status(200);
      return res.json(response);
    } catch (error) {
      res.status(500);
      return res.json(error);
    }
  });

  // Add item to a cart
  service.put("/cart/:item/:quantity", async (req, res) => {
    let { item, quantity } = req.params;
    quantity = Number(quantity);
    try {
      const exists = await Products.findOne({ desc: item }).exec();
      //check if item exists else return 404
      if (!exists) {
        res.status(404);
        return res.send({ status: 404, msg: `Item ${item} does not exist` });
      }
      //check if there is stock else return 400
      if (!isAvailable(exists, quantity)) {
        res.status(400);
        return res.send({ status: 400, msg: `Not enough stock for ${item}` });
      }
      const cart = await Cart.findOne().exec();
      let updatedItems = [...cart.items];
      let itemInCart = updatedItems.find((it) => it.cod === exists.cod);
      if (!!itemInCart) {
        const newQuantity = itemInCart.quantity + quantity;
        itemInCart.quantity = newQuantity;
      } else {
        const { cod, desc } = exists;
        const newItem = { cod, desc, quantity };
        updatedItems.push(newItem);
      }
      const newCart = await updateCart(cart, updatedItems);
      await updateItemStock(exists.cod, exists.stock - quantity);
      res.status(200);
      return res.json(newCart);
    } catch (error) {
      res.status(500);
      res.send(error);
    }
  });

  // Remove item from the cart
  service.delete("/cart/:item/:quantity", async (req, res) => {
    let { item, quantity } = req.params;
    quantity = Number(quantity);
    try {
      const exists = await Products.findOne({ desc: item }).exec();
      //check if item exists else return 404
      if (!exists) {
        res.status(404);
        return res.send({ status: 404, msg: `Item ${item} does not exist` });
      }
      const cart = await Cart.findOne().exec();
      let updatedItems = cart.items;
      let itemInCart = updatedItems.find((it) => it.desc === item);
      if (!!itemInCart) {
        const newQuantity = itemInCart.quantity - quantity;
        if (newQuantity <= 0) {
          const itemIndex = updatedItems.findIndex((it) => it.desc === item);
          updatedItems.splice(itemIndex, 1);
        } else {
          itemInCart.quantity = newQuantity;
        }
      } else {
        res.status(404);
        return res.send({
          status: 400,
          msg: `Item ${item} is not in the cart.`,
        });
      }
      const newCart = await updateCart(cart, updatedItems);
      await updateItemStock(exists.cod, exists.stock + quantity);
      res.status(200);
      return res.json(newCart);
    } catch (error) {
      res.status(500);
      res.json(error);
    }
  });

  const isAvailable = (item, qty) => {
    const { stock } = item;
    return stock >= qty;
  };

  const updateCart = async (cart, newItems) => {
    try {
      const newCart = await Cart.findOneAndUpdate(
        { id: cart.id },
        {
          items: newItems,
        },
        { new: true }
      );
      console.log(`Successfully updated cart: ${JSON.stringify(newCart)}`);
      return newCart;
    } catch (error) {
      console.error(`Failed to find and update cart: ${error}`);
    }
  };

  const updateItemStock = async (cod, stock) => {
    try {
      const newItem = await Products.findOneAndUpdate(
        { cod },
        {
          stock,
        },
        { new: true }
      );
      console.log(`Successfully updated item: ${JSON.stringify(newItem)}`);
      return newItem;
    } catch (error) {
      console.error(`Failed to find and update item: ${error}`);
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
