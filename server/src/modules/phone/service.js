const { ObjectId } = require("mongoose").Types;
const { name } = require("./model");

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

module.exports = {
  getQuery,
  modelName: name,
};
