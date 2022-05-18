const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const {
  getInstance: getEventEmitterInstance,
} = require("../../core/event-manager");
const { Model, name: modelName } = require("./model");
const {
  dynamicSearch,
  update,
  searchOne,
  save,
} = require("../../core/repository");

let eventEmitter;
const clients = [];

const createClient = (number, req, res) => {
  console.log("createClient", number);
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: number,
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--remote-debugging-port=9222",
      ],
      executablePath: "/usr/bin/google-chrome",
    },
  });

  // Save session values to the file upon successful auth
  client.on("authenticated", () => {
    console.log("authenticated", client.authStrategy.clientId);
    const phoneNumber = client.authStrategy.clientId;
    searchOne({ number: phoneNumber }, modelName).then((phoneModel) => {
      // eslint-disable-next-line no-param-reassign
      phoneModel.isConnected = true;
      update(phoneModel, modelName).then((updatedPhoneModel) => {
        console.log("authenticated", updatedPhoneModel);
      });
    });
  });

  client.on("qr", (qr) => {
    // Generate and scan this code with your phone
    console.log("QR RECEIVED", qr, number);
    qrcode.generate(qr, { small: true });
    res && res.write(qr);
  });

  const verifyText =
    "Please type `verify` followed by space then your fully qualified phone number with country code to verify your number. Example: `verify 8801XXXXXXXXX` for Bangladeshi number";

  client.on("ready", (x) => {
    console.log("Client is ready!", x);
    eventEmitter.on("send-msg", (smsObj) => {
      console.log("send-msg received", smsObj); // 61492142082@c.us
      try {
        client.sendMessage(smsObj.to, smsObj.body).then((message) => {
          console.log("message sent", message);
          eventEmitter.emit(`sent-msg`, { ...smsObj, ...message });
        });
      } catch (error) {
        console.log("error", error);
      }
    });
    // client.sendMessage(`${process.env.SYSTEM_PHONE}@c.us`, "authenticated");

    if (number === process.env.SYSTEM_PHONE) {
      eventEmitter.on("verify-phone", (phoneObj) => {
        console.log("verify-phone", phoneObj);
        client
          .sendMessage(`${phoneObj.number}@c.us`, verifyText)
          .then((message) => {
            console.log("message sent", message);
          });
      });
    }
    clients.push(client);
  });

  client.on("message", (msg) => {
    console.log("message", msg);
    if (msg.body === "!ping") {
      msg.reply("pong");
    }

    let handled = false;

    if (number === process.env.SYSTEM_PHONE) {
      if (msg.body.toLowerCase().startsWith("verify ")) {
        const phoneNumber = msg.body.split(" ")[1];
        console.log("verify phone", phoneNumber);
        if (msg.from.startsWith(phoneNumber)) {
          searchOne({ number: phoneNumber }, modelName).then((phoneModel) => {
            if (!phoneModel) {
              msg.reply(
                "Phone number not found. To have your own bot using your number, or to know more about this WhatsApp bot, please contact the admin via email at foyzulkarim@gmail.com or facebook.com/foyzulkarim365"
              );
            } else {
              // eslint-disable-next-line no-param-reassign
              phoneModel.isVerified = true;
              update(phoneModel, modelName).then((updatedPhoneModel) => {
                console.log("phone verified", updatedPhoneModel);
                msg.reply(
                  "Your phone is now verified. You can activate your phone now."
                );
              });
            }
          });
        } else {
          msg.reply(
            "Invalid number. Phone number not verified. Please try again or type `help`"
          );
        }
        handled = true;
      }
    }

    if (msg.body.toLowerCase() === "help") {
      let reply1 =
        "The receiver didn't setup the bot properly. Please contact the system administrator or type `know more`.";
      if (msg.to.startsWith(process.env.SYSTEM_PHONE)) {
        reply1 += `\n\n${verifyText}`;
      }
      client.sendMessage(msg.from, reply1);
      handled = true;
    }

    if (msg.body.toLowerCase() === "know more") {
      client.sendMessage(
        msg.from,
        "This hardcoded chatbot is built by Foyzul Karim. For dynamic logic for your  system, you can reach him via email at foyzulkarim@gmail.com or facebook.com/foyzulkarim365"
      );
      handled = true;
    }

    const greetings = [
      "hi",
      "hello",
      "yo",
      "hey",
      "hi there",
      "hey there",
      "assalamu alaikum",
      "salam",
    ];
    if (greetings.includes(msg.body.toLowerCase())) {
      client.sendMessage(
        msg.from,
        "Hey there! \n How can I help you? \n Type `help` for more info."
      );
      handled = true;
    }

    if (
      msg === "authenticated" ||
      msg ===
      "I am groot. I don't understand your words. Please type `help` for more info."
    ) {
      handled = true;
    }

    if (!handled) {
      client.sendMessage(
        msg.from,
        "I am groot. I don't understand your words. Please type `help` for more info."
      );
    }

    // eventEmitter.emit("new-message-arrived", msg);
  });

  client.on("message_ack", (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if (ack === 3) {
      // The message was read
      console.log("Message read!", msg.body);
    }
  });

  client.on("change_state", (state) => {
    console.log("CHANGE STATE", state);
  });

  client.on("disconnected", (e) => {
    console.log("disconnected", e);
  });

  client.initialize().then((x) => console.log("client created", x));
  return client;
};

const loadClients = async () => {
  const phones = await dynamicSearch(
    { isVerified: true, isConnected: true },
    modelName
  );

  console.log("numbers", phones.length);
  phones.forEach((p) => {
    createClient(p.number, null, null);
    // clients.push(client);
  });
  if (phones.length === 0) {
    console.log("No phones found. setting up system phone");
    const phone = {
      number: process.env.SYSTEM_PHONE,
      isVerified: true,
      alias: "System",
    };
    await save(phone, modelName);
    createClient(process.env.SYSTEM_PHONE, null, null);
  }
};

const setup = async () => {
  eventEmitter = getEventEmitterInstance();
  eventEmitter.on("databaseConnectionEstablished", async () => {
    console.log("whatsapp.js=> databaseConnectionEstablished");
    console.log("whatsapp.js=> loadClients");
    // await loadClients();
  });
};

module.exports = { createClient, loadClients, setup };
