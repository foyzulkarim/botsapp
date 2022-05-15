const mongoose = require("mongoose");

// schema
const schema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    isDelivered: { type: Boolean, default: false },
    text: { type: String, required: true },
    errorMessage: { type: String },
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
schema.index({ text: "text" });

// index for createdAt and updatedAt
schema.index({ createdAt: 1 });
schema.index({ updatedAt: 1 });

schema.index({ createdBy: 1, isDelivered: 1 });
schema.index({ createdBy: 1, sender: 1, receiver: 1 });

const ModelName = "Message";

module.exports = { Model: mongoose.model(ModelName, schema), name: ModelName };
