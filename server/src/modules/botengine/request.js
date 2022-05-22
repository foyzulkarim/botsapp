const Joi = require("joi");

const schema = Joi.object().keys({
  _id: Joi.string().optional(),
  number: Joi.string().max(15).required(),
  requestText: Joi.string().min(1).max(30).required(),
  responseText: Joi.string().required(),
});

const validate = (data, user) => {
  const result = schema.validate(data);
  result.value = {
    ...data,
    createdBy: user.id,
    updatedBy: user.id,
  };
  return result;
};

module.exports = { validate };
