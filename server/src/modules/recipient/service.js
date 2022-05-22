const { ObjectId } = require("mongoose").Types;
const { name: modelName } = require("./model");
const { dynamicSearch } = require("../../core/repository");

const getQuery = (payload) => {
  const createdBySubQuery = { createdBy: ObjectId(payload.userId) };

  let query = createdBySubQuery;
  if (payload.requestText) {
    query = {
      $and: [
        createdBySubQuery,
        { requestText: { $regex: payload.requestText, $options: "i" } },
      ],
    };
  }
  return query;
};

const checkIfAllowed = async (payload) => {
  const { createdBy } = payload;
  const result = await dynamicSearch({ createdBy }, modelName);
  return result.length < 3;
};

module.exports = {
  getQuery,
  modelName,
  checkIfAllowed,
};
