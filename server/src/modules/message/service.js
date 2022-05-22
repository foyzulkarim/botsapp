const { ObjectId } = require("mongoose").Types;
const { name: modelName } = require("./model");
const { sendMessage } = require("./background2");
const {
  getInstance: getEventEmitterInstance,
} = require("../../core/event-manager");
const { dynamicSearch, count } = require("../../core/repository");
const { GeneralError } = require("../../common/errors");

const getQuery = (payload) => {
  const createdBySubQuery = { createdBy: ObjectId(payload.userId) };

  let query = createdBySubQuery;
  if (payload.text) {
    query = {
      $and: [
        createdBySubQuery,
        {
          $or: [
            { sender: { $regex: payload.text, $options: "i" } },
            { receiver: { $regex: payload.text, $options: "i" } },
          ],
        },
      ],
    };
  }
  return query;
};

const checkIfValidToSave = async (payload) => {
  const recipient = await dynamicSearch(
    { number: payload.toNumber, createdBy: payload.createdBy },
    "Recipient"
  );
  if (!recipient) {
    const errorMessage = `Recipient not found`;
    return new GeneralError(errorMessage);
  }
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const c = await count(
    { createdBy: payload.createdBy, createdAt: { $gt: d } },
    modelName
  );
  if (c > 50) {
    const errorMessage = `You have reached the maximum allowed messages`;
    return new GeneralError(errorMessage);
  }
  return true;
};

const setupEventListeners = async (eventEmitter) => {
  eventEmitter.on(`${modelName}Created`, async (model) => {
    if (model.shouldSend) {
      await sendMessage(model);
    }
    console.log(`${modelName} created`, model);
  });
  eventEmitter.on(`${modelName}Updated`, (model) => {
    console.log(`${modelName} updated`, model);
  });
  eventEmitter.on(`${modelName}Deleted`, (model) => {
    console.log(`${modelName} deleted`, model);
  });
};

(async () => {
  const em = getEventEmitterInstance();
  // const q = new Queue("transactions");
  await setupEventListeners(em);
  console.log(`${modelName} event listeners setup`);
})();

module.exports = {
  getQuery,
  modelName,
  checkIfValidToSave,
};
