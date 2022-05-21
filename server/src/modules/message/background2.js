const { CronJob } = require("cron");
const parse = require("date-fns/parse");
const logger = require("pino")();
const { dynamicSearch, update, searchOne } = require("../../core/repository");
const { name: ModelName } = require("./model");
const {
  getInstance: getEventEmitterInstance,
} = require("../../core/event-manager");

const job = new CronJob(
  "* * * * *",
  () => {
    console.log("You will see this message every second");
  },
  null,
  true,
  "Australia/Melbourne"
);

const sendMessage = async (smsObj) => {
  const em = getEventEmitterInstance();
  em.on(`msg-sent`, async (responseMessage) => {
    console.log(
      `waWorker - ${ModelName} sent-msg-${smsObj._id}`,
      responseMessage
    );
    const dbModel = await searchOne({ _id: smsObj._id }, ModelName);
    if (dbModel) {
      dbModel.isSent = true;
      await update(dbModel, ModelName);
    }
  });

  em.emit(`send-msg`, smsObj);
  console.log(`sendMessage - ${ModelName} message sent`, smsObj);
  return true;
};

module.exports = { sendMessage };
