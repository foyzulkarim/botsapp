const mongoose = require("mongoose");

// schema
const schema = new mongoose.Schema(
  {
    waId: { type: String, required: false },
    fromMe: { type: Boolean, default: false },
    from: { type: String, required: true },
    to: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, required: true, default: "chat" },
    notifyName: { type: String, required: false },
    isBkash: { type: Boolean, default: false },
    bkashText: { type: String, required: false },
    isProcessed: { type: Boolean, required: true, default: false },
    isSent: { type: Boolean, required: true, default: false },
    isError: { type: Boolean, required: true, default: false },
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
