const routes = require("./controller");
const {
  authenticateRequest,
  authorizeRequest,
} = require("../../common/middlewares");

const { name: modelName } = require("./model");

const processRequest = async (req, res, next) => {
  req.modelName = modelName;
  return next();
};

const init = async (app) => {
  app.use(
    "/api/phones",
    authenticateRequest,
    authorizeRequest,
    processRequest,
    routes
  );
  return app;
};

module.exports = { init };
