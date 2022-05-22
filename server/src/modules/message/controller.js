const express = require("express");
const { getQuery, checkIfValidToSave } = require("./service");
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
  const canProceed = await checkIfValidToSave(req.body);
  if (canProceed instanceof Error) {
    return next(canProceed);
  }
  return baseSaveHandler(req, res, next);
};

const searchAnalysisHandler = async (req, res, next) =>
  res.status(200).send({
    success: true,
    data: {
      totalBotMessage: 100,
      totalMessageSent: 200,
      recentMessages: [
        {
          from: "123",
          to: "456",
          body: "Hello",
          createdAt: new Date(),
        },
      ],
    },
  });

router.get("/detail", getByIdHandler);
router.post("/create", handleValidation(validate), saveHandler);
router.put("/update", handleValidation(validate), updateHandler);
router.post("/search", searchHandler);
router.post("/count", countHandler);
router.delete("/delete", deleteHandler);
router.post("/analysis", searchAnalysisHandler);

module.exports = router;
