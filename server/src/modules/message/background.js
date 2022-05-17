const parse = require("date-fns/parse");
const logger = require("pino")();
const { Queue, Worker, QueueScheduler } = require("bullmq");
// const { parseSms } = require("./service");
const { dynamicSearch, update, searchOne } = require("../../core/repository");
const { name: ModelName } = require("./model");
const {
  getInstance: getEventEmitterInstance,
} = require("../../core/event-manager");

const connection = {
  removeOnComplete: true,
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  concurrency: parseInt(process.env.CONCURRENT_REQUESTS, 10) || 5,
  limiter: {
    max: parseInt(process.env.MAX_REQUESTS, 10) || 10,
    duration: 1000,
  },
};

const trxSchedulerName = "transactions-scheduler";
const trxQueueScheduler = new QueueScheduler(trxSchedulerName, connection);
const trxSchedulerQueue = new Queue(trxSchedulerName, connection);

const trxQueueName = "transactions";
const trxQueue = new Queue(trxQueueName, connection);

const waSchedulerName = "wa-scheduler";
const waQueueScheduler = new QueueScheduler(waSchedulerName, connection);
const waSchedulerQueue = new Queue(waSchedulerName, connection);

const waQueueName = "whatsapps";
const waQueue = new Queue(waQueueName, connection);

const parseSms = ({ text, type }) => {
  try {
    const parts = text.split(". ");
    const received = parts[0];
    const receivedParts = received.split(" from ");
    const tkStrIndex =
      received.indexOf("iBanking") !== -1 ? receivedParts[1] : receivedParts[0];
    const amount = parseFloat(tkStrIndex.split("Tk ")[1].replaceAll(",", ""));

    const sender =
      received.indexOf("iBanking") !== -1
        ? receivedParts[2]
        : `${receivedParts[1].split(" ")[0]}`;
    const balance = parseFloat(parts[2].split("Tk ")[1].replaceAll(",", ""));
    const trxs = parts[3].split(" at ");
    const TrxID = trxs[0].split("TrxID ")[1];
    const date = parse(
      `${trxs[1]} +06`,
      "dd/MM/yyyy HH:mm x",
      new Date()
    ).toISOString();

    const smsObj = {
      isProcessed: true,
      text,
      type,
      sender,
      amount,
      balance,
      trxId: TrxID,
      date,
    };
    return smsObj;
  } catch (error) {
    const smsObj = {
      isProcessed: true,
      text,
      type,
      isError: true,
      errorMessage: error.message,
    };
    return smsObj;
  }
};

const trxQueueWorker = new Worker(
  trxQueueName,
  async (job) => {
    const { _id, text, type } = job.data;
    const smsObj = parseSms({ text, type });
    const model = { ...smsObj, _id };
    if (smsObj.trxId) {
      const dbModel = await searchOne({ trxId: smsObj.trxId }, ModelName);
      if (dbModel) {
        model.isError = true;
        model.errorMessage = "Transaction already exists";
      }
    }
    const result = await update(model, ModelName);
    return model;
  },
  connection
);

trxQueueWorker.on("completed", async (job) => {
  console.log(
    `queue completed job.id ${job.id} of name ${job.name} has processed!`
  );
});

trxQueueWorker.on("failed", (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});

const trxSchedulerWorker = new Worker(
  trxSchedulerName,
  async () => {
    const unProcessedList = await dynamicSearch(
      { isProcessed: false, fromMe: true, isBkash: true },
      ModelName
    );

    const results = await Promise.all(
      unProcessedList.map(async (item) => {
        const result = await trxQueue.add("parse-sms", item);
        console.log(
          `schedulerWorker - ${ModelName} parse-sms queued`,
          result.id,
          result.name,
          item._id
        );
        return result;
      })
    );
    return { listCount: unProcessedList.length, results };
  },
  connection
);

trxSchedulerWorker.on("completed", async (job) => {
  console.log(
    `schedulerWorker completed job.id ${job.id} of name ${job.name} has completed!`
  );
});

const sendSms = async (smsObj) => {
  // const { sender, trxId } = smsObj;
  // const sms = `${text} from ${sender} at ${date} Tk ${amount} TrxID ${trxId}`;
  // const result = { sms, type };
  const em = getEventEmitterInstance();

  em.on(`sent-msg`, async (responseMessage) => {
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
  console.log(`sendSms - ${ModelName} message sent`, smsObj);
  return true;
};

const waWorker = new Worker(
  waQueueName,
  async (job) => {
    console.log(
      `waWorker - ${ModelName} job.id ${job.id} of name ${job.name}`,
      job
    );
    const { from, to, body, _id } = job.data;
    sendSms({ from, to, body, _id });
    // const dbModel = await searchOne({ trxId }, ModelName);
    // if (dbModel) {
    //   dbModel.isSent = true;
    // }
    // const result = await update(dbModel, ModelName);
    // return result;
    return true;
  },
  connection
);

waWorker.on("completed", async (job) => {
  console.log(
    `queue completed job.id ${job.id} of name ${job.name} has processed!`,
    job.returnvalue
  );
});

waWorker.on("failed", (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});

const waSchedulerWorker = new Worker(
  waSchedulerName,
  async () => {
    const unProcessedList = await dynamicSearch(
      { fromMe: true, isProcessed: true, isSent: false },
      ModelName
    );
    console.log(
      `waSchedulerWorker - ${ModelName} send-sms queued`,
      unProcessedList.length
    );
    const results = await Promise.all(
      unProcessedList.map(async (item) => {
        const result = await waQueue.add("send-msg", item);
        console.log(
          `waSchedulerWorker - ${ModelName} send-msg queued`,
          result.id,
          result.name,
          item._id
        );
        return result;
      })
    );
    return { listCount: unProcessedList.length, results };
  },
  connection
);

waSchedulerWorker.on("completed", async (job) => {
  console.log(
    `schedulerWorker completed job.id ${job.id} of name ${job.name} has completed!`
  );
});

const startScheduler = async () => {
  await trxSchedulerQueue.add(
    "parse-sms",
    { time: new Date().toISOString() },
    {
      repeat: {
        cron: "* * * * *",
      },
      removeOnComplete: true,
    }
  );

  await waSchedulerQueue.add(
    "send-msg",
    { time: new Date().toISOString() },
    {
      repeat: {
        cron: "* * * * *",
      },
      removeOnComplete: true,
    }
  );
};

if (process.env.BACKGROUND === "true") {
  startScheduler();
}

module.exports = { queue: trxQueue };
