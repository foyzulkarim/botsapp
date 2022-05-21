const { ObjectId } = require("mongoose").Types;
const { name: modelName } = require("./model");
const { queue, sendMessage } = require("./background");
const {
  getInstance: getEventEmitterInstance,
} = require("../../core/event-manager");

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
};
