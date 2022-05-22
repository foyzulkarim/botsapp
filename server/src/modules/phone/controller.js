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

const {
  createClient,
  setup: setupWhatsApp,
  getWhatsAppClientByNumber,
} = require("./whatsapp2");

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
  const maxPhoneExists = await checkIfPhoneExists(req.body);
  if (maxPhoneExists) {
    const errorMessage = `Already max phone exists.`;
    return next(new GeneralError(errorMessage));
  }
  return baseSaveHandler(req, res, next);
};

const phoneActivateHandler = async (req, res, next) => {
  const { number } = req.query;
  const phone = await searchOne({ number, isVerified: true }, modelName);
  if (!phone) {
    const errorMessage = `Verified phone not found`;
    return next(new GeneralError(errorMessage));
  }
  createClient(number, req, res);
};

const preValidateHandler = async (req, res, next) => {
  const { id } = req.query;
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
};

setupWhatsApp();

router.get("/detail", getByIdHandler);
router.post("/create", handleValidation(validate), saveHandler);
router.put("/update", handleValidation(validate), updateHandler);
router.post("/search", searchHandler);
router.post("/count", countHandler);
router.delete("/delete", deleteHandler);
router.get("/activate", phoneActivateHandler);
router.get("/prevalidateactivation", preValidateHandler);

module.exports = router;
