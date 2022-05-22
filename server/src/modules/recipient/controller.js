const express = require("express");
const { getQuery, checkIfAllowed } = require("./service");
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
  const allowed = await checkIfAllowed(req.body);
  if (!allowed) {
    const errorMessage = `New recipient not allowed. Max recipient allowed on demo is 3`;
    return next(new GeneralError(errorMessage));
  }
  return baseSaveHandler(req, res, next);
};

router.get("/detail", getByIdHandler);
router.post("/create", handleValidation(validate), saveHandler);
router.put("/update", handleValidation(validate), updateHandler);
router.post("/search", searchHandler);
router.post("/count", countHandler);
router.delete("/delete", deleteHandler);

module.exports = router;
