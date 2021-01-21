const express = require("express");
const axios = require("axios");

const service = express();

const mongoclient = require("mongodb").MongoClient;
const assert = require("assert");

module.exports = (config) => {
  let dataService = { servicename: "data-service" };

  const init = async () => {
    const log = config.log();
    // Add a request logging middleware in development mode
    if (service.get("env") === "development") {
      try {
        dataService = await axios.get(
          `http://localhost:3000/find/${dataService.servicename}`
        ).data;
      } catch(e) {
        log.debug(e);
      }
      service.use((req, next) => {
        log.debug(`${req.method}: ${req.url}`);
        return next();
      });
    }
  };

  await init();

  service.get("/cart", async (req, res) => {
    try {
      const cart = await axios.get(
        `http://localhost:${dataService.port}/cart`
      ).data;
      res.status(200);
      res.json(cart);
    } catch (error) {
      res.status(error.status);
      res.json(error);
    } finally {
      return res;
    }
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
