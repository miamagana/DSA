const mongoclient = require("mongodb").MongoClient;
const assert = require("assert");

const url = "mongodb://mongodb:27017";

mongoclient.connect(url, (err, client) => {
  assert.strictEqual(err, null);
  console.log("Connected to DB");
  const db = client.db("almacen");
  addToCart(db, "muelles", 2);
  addToCart(db, "hierros", 2);
  addToCart(db, "maderas", 2);
  addToCart(db, "palos", 1);
  setTimeout(function () {
    removeFromCart("muelles", 1);
    removeFromCart("hierros", 2);
    removeFromCart("hierros", 2);
  }, 500);
});

const shopping_cart = [];

/* 
    Function to add an element from the cart 
    If the element does not exist in the DB it warns the user
    Act 2: If there is no stock it warns the user by console.
*/
const addToCart = (db, description, quantity) => {
  return new Promise((resolve) => {
    const collection = db.collection("products");
    findProduct(description, collection)
      .then((element) => {
        // Act 2: Check if there are items in stock
        if (enoughItemsInStock(element, quantity)) {
          const productInCart = shopping_cart.find(
            (prod) => prod.desc === description
          );
          if (!!productInCart) {
            productInCart.quantity += quantity;
          } else {
            const { cod, desc } = element;
            const product = { cod, desc, quantity };
            shopping_cart.push(product);
          }
          resolve(logCart());
        } else {
          logNoStock(description);
        }
      })
      .catch(() => console.warn(`Product ${description} does not exist`));
  });
};

/* 
    Function to remove an element from the cart 
    If the quantity of the product to remove is greater or equal the current quantity it 
    removes the element from the cart entirely, otherwise just substracts the quantity for the cart.
*/
const removeFromCart = (description, quantity) => {
  return new Promise((resolve) => {
    const productInCart = shopping_cart.find(
      (prod) => prod.desc === description
    );
    if (productInCart) {
      const newQuantity = productInCart.quantity - quantity;
      if (newQuantity <= 0) {
        const index = shopping_cart.findIndex(
          (prod) => prod.desc === description
        );
        shopping_cart.splice(index, 1);
      } else {
        productInCart.quantity = newQuantity;
      }
      return resolve(logCart());
    } else {
      console.log(`Product ${description} is not in the cart`);
    }
  });
};

const findProduct = (desc, collection) => {
  return new Promise((resolve, reject) => {
    collection.findOne({ desc }, (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
};

function logCart() {
  console.log(`Your cart: ${JSON.stringify(shopping_cart)}`);
}

// Activity 2
function logNoStock(product) {
  console.log(
    `Your request to add ${product} can not be processed due to lack of stock`
  );
}

// Activity 2
const enoughItemsInStock = (product, quantity) => {
  return product.stock >= quantity;
};
