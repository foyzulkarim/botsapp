const mongoose = require("mongoose");

// schema
const schema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    alias: { type: String, unique: true, required: true },
    type: { type: String, required: true },
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
schema.index({ name: "text" });

schema.index({ type: 1 });

// index for createdAt and updatedAt
schema.index({ createdAt: 1 });
schema.index({ updatedAt: 1 });

const ModelName = "Resource";

module.exports = { Model: mongoose.model(ModelName, schema), name: ModelName };
