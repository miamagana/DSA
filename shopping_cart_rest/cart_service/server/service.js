const express = require("express");
const axios = require("axios");
const service = express();

module.exports = (config) => {
  let dataService = { servicename: "data-service" };
  const log = config.log();
  const init = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/find/${dataService.servicename}`
      );
      dataService = res.data;
      log.debug(dataService);
    } catch (e) {
      log.debug(e);
    }
  };

  init();

  service.get("/cart", async (req, res) => {
    try {
      const response = await axios.get(
        `http://localhost:${dataService.serviceport}/cart`
      );
      res.status(200);
      res.json(response.data);
    } catch (error) {
      const { status, msg } = error.response.data;
      res.status(status);
      res.send(msg);
    } finally {
      return res;
    }
  });

  service.put("/cart/:item/:qty", async (req, res) => {
    try {
      const { item, qty } = req.params;
      const response = await axios.put(
        `http://localhost:${dataService.serviceport}/cart/${item}/${qty}`
      );
      res.status(200);
      res.json(response.data);
    } catch (error) {
      const { status, msg } = error.response.data;
      res.status(status);
      res.send(msg);
    } finally {
      return res;
    }
  });

  service.delete("/cart/:item/:qty", async (req, res) => {
    try {
      const { item, qty } = req.params;
      const response = await axios.delete(
        `http://localhost:${dataService.serviceport}/cart/${item}/${qty}`
      );
      res.status(200);
      res.json(response.data);
    } catch (error) {
      const { status, msg } = error.response.data;
      res.status(status);
      res.send(msg);
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
