const { ObjectId } = require("mongoose").Types;
const { name: modelName } = require("./model");
const { queue } = require("./background");
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
    const result = await queue.add("parse-sms", model);
    console.log(`${modelName} parse-sms queued`, result.id, result.name);
  });
  eventEmitter.on(`${modelName}Updated`, (model) => {
    console.log(`${modelName} updated`, model);
  });
  eventEmitter.on(`${modelName}Deleted`, (model) => {
    console.log(`${modelName} deleted`, model);
  });
};

const init = async () => {
  const em = getEventEmitterInstance();
  // const q = new Queue("transactions");
  await setupEventListeners(em);
  console.log(`${modelName} event listeners setup`);
};

module.exports = {
  getQuery,
  modelName,
};
