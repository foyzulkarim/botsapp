const mongoose = require("mongoose");
const { MongoError } = require("../../common/errors");

// schema
const schema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    requestText: { type: String, required: true },
    responseText: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: "000000000000",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: "000000000000",
    },
  },
  { timestamps: true }
);

// indices
// text index for name
schema.index({ requestText: "text" });

// index for createdAt and updatedAt
schema.index({ createdAt: 1 });
schema.index({ updatedAt: 1 });

// index for createdby and updatedby
schema.index({ createdBy: 1 });
schema.index({ number: 1 });

schema.post("save", (error, doc, next) => {
  if (error.name === "MongoError" && error.code === 11000) {
    // if error.message contains the substring 'duplicate key error' then it's a duplicate username
    if (error.message.includes("duplicate key error")) {
      const errorMessage = `Name already exists`;
      next(new MongoError(errorMessage));
    } else next(new MongoError(error.message));
  } else {
    next();
  }
});

const ModelName = "Botengine";

module.exports = { Model: mongoose.model(ModelName, schema), name: ModelName };
