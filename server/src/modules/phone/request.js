const Joi = require("joi");

const schema = Joi.object().keys({
  _id: Joi.string().optional(),
  number: Joi.string().min(8).max(15).required(),
  alias: Joi.string().min(5).max(30).required(),
});

const validate = (data, user) => {
  const result = schema.validate(data);
  result.value = {
    ...data,
    isVerified: false,
    createdBy: user.id,
    updatedBy: user.id,
  };
  return result;
};

module.exports = { validate };
