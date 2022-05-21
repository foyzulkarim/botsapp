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
  getById,
  save,
} = require("../../core/repository");
const { GeneralError } = require("../../common/errors");
// const {
//   // createClient: createWaClient,
//   setup: setupWhatsApp,
// } = require("./whatsapp");

const { createClient, setup: setupWhatsApp, getWhatsAppClientByNumber } = require("./whatsapp2");

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
    // return next(new GeneralError(errorMessage));
    console.log("Already phone exists");
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
  createClient(number, req, res);
});
router.get("/prevalidateactivation/:id", async (req, res, next) => {
  const { id } = req.params;
  const phone = await getById(id, modelName);
  if (!phone) {
    const errorMessage = `Phone not found`;
    return next(new GeneralError(errorMessage));
  }
  if (!phone.isVerified) {
    const errorMessage = `Phone is not verified`;
    return next(new GeneralError(errorMessage));
  }

  const client = getWhatsAppClientByNumber(phone.number);
  if (client) {
    const errorMessage = `Phone is already activated`;
    return next(new GeneralError(errorMessage));
  }

  return res
    .status(200)
    .send({ success: true, message: `Phone is ready to be activated`, phone });
});

module.exports = router;
