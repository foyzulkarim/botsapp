const { ObjectId } = require("mongoose").Types;
const { name: modelName } = require("./model");
const { dynamicSearch } = require("../../core/repository");
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
            { number: { $regex: payload.text, $options: "i" } },
            { alias: { $regex: payload.text, $options: "i" } },
          ],
        },
      ],
    };
  }
  return query;
};

const checkIfPhoneExists = async (payload) => {
  const { createdBy } = payload;
  const result = await dynamicSearch({ createdBy }, modelName);
  return result.length > 0;
};

const setupEventListeners = async (eventEmitter) => {
  eventEmitter.on(`${modelName}Created`, async (model) => {
    // if (model.isBkash) {
    //   const result = await queue.add("parse-sms", model);
    //   console.log(`${modelName} parse-sms queued`, result.id, result.name);
    // }
    eventEmitter.emit("verify-phone", model);
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
  checkIfPhoneExists,
};
