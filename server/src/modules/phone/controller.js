const express = require("express");
const { getQuery, checkIfPhoneExists, modelName } = require("./service");
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
const {
  dynamicSearch,
  update,
  searchOne,
  save,
} = require("../../core/repository");
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
router.get("/activate/:number", async (req, res, next) => {
  const { number } = req.params;
  const phone = await searchOne({ number, isVerified: true }, modelName);
  if (!phone) {
    const errorMessage = `Verified phone not found`;
    return next(new GeneralError(errorMessage));
  }
  createWaClient(number, req, res);
});

module.exports = router;
