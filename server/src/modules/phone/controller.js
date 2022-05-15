const express = require("express");
const { getQuery, checkIfPhoneExists } = require("./service");
const {
  getByIdHandler,
  saveHandler: baseSaveHandler,
  updateHandler,
  searchHandler: baseSearchHandler,
  countHandler: baseCountHandler,
  deleteHandler,
} = require("../../core/controller");
const { validate } = require("./request");
const { handleValidation } = require("../../common/middlewares");
const { GeneralError } = require("../../common/errors");
const {
  createClient: createWaClient,
  setup: setupWhatsApp,
} = require("./whatsapp");

const router = express.Router();

const searchHandler = async (req, res, next) => {
  req.searchQuery = getQuery({ ...req.body, userId: req.user.id });
  return baseSearchHandler(req, res, next);
};

const countHandler = async (req, res, next) => {
  req.searchQuery = getQuery({ ...req.body, userId: req.user.id });
  return baseCountHandler(req, res, next);
};

const saveHandler = async (req, res, next) => {
  const phoneExists = await checkIfPhoneExists(req.body);
  if (phoneExists) {
    const errorMessage = `Already a phone exists`;
    return next(new GeneralError(errorMessage));
  }
  return baseSaveHandler(req, res, next);
};

setupWhatsApp();

router.get("/detail", getByIdHandler);
router.post("/create", handleValidation(validate), saveHandler);
router.put("/update", handleValidation(validate), updateHandler);
router.post("/search", searchHandler);
router.post("/count", countHandler);
router.delete("/delete", deleteHandler);
router.get("/activate/:number", async (req, res) => {
  const { number } = req.params;
  createWaClient(number, req, res);
});

module.exports = router;
