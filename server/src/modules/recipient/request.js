const Joi = require("joi");

const schema = Joi.object().keys({
  _id: Joi.string().optional(),
  waNumber: Joi.string().optional(),
  name: Joi.string().required(),
  number: Joi.string().required(),
});

const validate = (data, user) => {
  const result = schema.validate(data);
  result.value = {
    ...data,
    waNumber: `${data.number}@c.us`,
    createdBy: user.id,
    updatedBy: user.id,
  };
  return result;
};

module.exports = { validate };
