const { ObjectId } = require("mongoose").Types;
const { save, searchOne, updateAll } = require("../src/core/repository");
const { modelName } = require("../src/modules/phone/service");

const migrate = async (logger) => {
  logger.info(`Starting migration of ${modelName}`);
  const superadminUser = await searchOne({ username: "superadmin" }, "User");
  if (!superadminUser) {
    throw new Error(`Superadmin user not found`);
  }

  await updateAll(
    {
      number: process.env.SYSTEM_PHONE,
    },
    {
      createdBy: superadminUser._id,
      updatedBy: superadminUser._id,
    },
    modelName
  );
  logger.info(`Migration of ${modelName} finished`);
};

module.exports = { migrate };
