const { ObjectId } = require("mongoose").Types;
const { name } = require("./model");

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

module.exports = {
  getQuery,
  modelName: name,
};
