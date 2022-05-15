const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const {
  getInstance: getEventEmitterInstance,
} = require("../../core/event-manager");
const { Model, name: modelName } = require("./model");
const { dynamicSearch, update, searchOne } = require("../../core/repository");

let eventEmitter;
const clients = [];

const createClient = (number, req, res) => {
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
    console.log("QR RECEIVED", qr);
    qrcode.generate(qr, { small: true });
    res && res.write(qr);
  });

  client.on("ready", (x) => {
    console.log("Client is ready!", x);
    // eventEmitter.on("send-msg", (p) => {
    //   console.log("send-msg received", p.sender, p.trxId); // 61492142082@c.us
    //   try {
    //     client.sendMessage(
    //       `${p.sender}@c.us`,
    //       `Thanks for your message. Your transaction ID is ${p.trxId}.`
    //     );
    //   } catch (error) {
    //     console.log("error", error);
    //   }
    // });
    client.sendMessage(`${process.env.SYSTEM_PHONE}@c.us`, "authenticated");
    clients.push(client);
  });

  client.on("message", (msg) => {
    if (msg.body === "!ping") {
      msg.reply("pong");
    }

    let handled = false;

    if (msg.body.toLowerCase() === "help") {
      let reply = "To verify your transaction id, type `Trx` \n";
      reply +=
        "To know more about this chatbot, who built this, how can you get this for yourself, type `Know more`";
      client.sendMessage(msg.from, reply);
      handled = true;
    }

    if (msg.body.toLowerCase() === "trx") {
      client.sendMessage(
        msg.from,
        "Please send your transaction id in this format `trxid id`"
      );
      handled = true;
    }

    if (msg.body.toLowerCase().startsWith("trxid")) {
      const trxId = msg.body.split(" ")[1];
      if (trxId) {
        client.sendMessage(msg.from, `Your transaction id is ${trxId}`);
      } else {
        client.sendMessage(
          msg.from,
          "Please send your transaction id in this format `trxid <id>`. Example `trxid 123456789`"
        );
      }
      handled = true;
    }

    if (msg.body.toLowerCase() === "know more") {
      client.sendMessage(
        msg.from,
        "This chatbot is built by Foyzul Karim. You can reach me via email at foyzulkarim@gmail.com or facebook.com/foyzulkarim365 or type `chat` to chat with me."
      );
      handled = true;
    }

    if (msg.body.toLowerCase() === "chat") {
      client.sendMessage(
        msg.from,
        "Hi. Thanks for your interest. Foyzul will reply you soon. Look for `non reply` messages. Thanks for your patience."
      );
      handled = true;
    }

    const greetings = [
      "hi",
      "hello",
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
      "Sorry, I am just a bot, I don't understand your words. Please type `help` for more info."
    ) {
      handled = true;
    }

    if (!handled) {
      client.sendMessage(
        msg.from,
        "Sorry, I am just a bot, I don't understand your words. Please type `help` for more info."
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

  client.initialize();
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
  // createClient(process.env.SYSTEM_PHONE.toString(), null, null);
};

const setup = async () => {
  eventEmitter = getEventEmitterInstance();
  eventEmitter.on("databaseConnectionEstablished", async () => {
    console.log("whatsapp.js=> databaseConnectionEstablished");
    console.log("whatsapp.js=> loadClients");
    await loadClients();
  });
};

module.exports = { createClient, loadClients, setup };
