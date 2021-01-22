const express = require("express");

const service = express();

module.exports = (config) => {
  const log = config.log();
  const services = {};

  service.put(
    "/register/:servicename/:serviceversion/:serviceport",
    (req, res, next) => {
      const { servicename, serviceversion, serviceport } = req.params;
      services[servicename] = { servicename, serviceversion, serviceport };
      res.status(200);
      log.debug(`${servicename} resgistered at port ${serviceport}`);
      return res;
    }
  );

  service.delete("/register/:servicename", (req, res, next) => {
    const { servicename } = req.params;
    if (!!services[servicename]) {
      delete services[servicename];
      res.status(200);
    } else {
      res.status(404);
    }
    return res;
  });

  service.get("/find/:servicename", (req, res, next) => {
    const { servicename } = req.params;
    const service = services[servicename];
    log.debug(services);
    log.debug(servicename);
    if (!!service) {
      res.status(200);
      res.json(service);
    } else {
      res.status(404);
    }
    return res;
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
