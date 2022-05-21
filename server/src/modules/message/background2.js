const { CronJob } = require("cron");
const fastq = require("fastq");
const { dynamicSearch, update, searchOne } = require("../../core/repository");
const { name: ModelName } = require("./model");
const {
  getInstance: getEventEmitterInstance,
} = require("../../core/event-manager");

async function worker(arg) {
  return JSON.stringify(arg);
}

const queue = fastq.promise(worker, 1);

async function run(item) {
  const result = await queue.push(item);
  console.log("the result is", result);
}

const sendMessageCronWorker = async () => {
  const unProcessedList = await dynamicSearch(
    { fromMe: true, isProcessed: true, isSent: false, shouldSend: true },
    ModelName
  );
  console.log("unProcessedList", unProcessedList.length);
  await Promise.all(
    unProcessedList.map(async (item) => {
      const result = await run(item);
      return result;
    })
  );
};

const job = new CronJob(
  "* * * * *",
  async () => {
    console.log("You will see this message every minute");
    await sendMessageCronWorker();
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
