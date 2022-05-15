const Joi = require("joi");

const schema = Joi.object().keys({
  _id: Joi.string().optional(),
  sender: Joi.string().min(8).max(15).required(),
  receiver: Joi.string().min(8).max(15).required(),
  text: Joi.string().min(3).max(40).required(),
});

const validate = (data, user) => {
  const result = schema.validate(data);
  result.value = {
    ...data,
    isDelivered: false,
    createdBy: user.id,
    updatedBy: user.id,
  };
  return result;
};

module.exports = { validate };
