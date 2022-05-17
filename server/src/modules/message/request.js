const Joi = require("joi");

const schema = Joi.object().keys({
  _id: Joi.string().optional(),
  from: Joi.string().min(8).max(15).required(),
  to: Joi.string().min(8).max(15).required(),
  body: Joi.string().min(3).max(40).required(),
});

const validate = (data, user) => {
  const result = schema.validate(data);
  result.value = {
    from: `${data.from}@c.us`,
    to: `${data.to}@c.us`,
    body: data.body,
    fromMe: true,
    isProcessed: true,
    createdBy: user.id,
    updatedBy: user.id,
  };
  return result;
};

module.exports = { validate };
