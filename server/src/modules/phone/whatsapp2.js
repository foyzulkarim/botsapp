// Supports ES6
const del = require("del");
const venom = require("venom-bot");
const {
  getInstance: getEventEmitterInstance,
} = require("../../core/event-manager");
const { Model, name: modelName } = require("./model");
const {
  dynamicSearch,
  update,
  searchOne,
  save,
  updateAll,
} = require("../../core/repository");

let eventEmitter;
const clients = [];

const verifyText =
  "Please type `verify` followed by space then your fully qualified phone number with country code to verify your number. Example: `verify 8801XXXXXXXXX` for Bangladeshi number";

function start(client, number) {
  console.log("starting", number);
  if (number === process.env.SYSTEM_PHONE) {
    eventEmitter.on("verify-phone", (phoneObj) => {
      console.log("verify-phone", phoneObj);
      client.sendText(`${phoneObj.number}@c.us`, verifyText).then((message) => {
        console.log("verification message sent", message);
      });
    });
  }

  client.onMessage((msg) => {
    console.log("message", msg);
    if (msg.from === "status@broadcast") {
      return;
    }
    if (msg.body === "!ping") {
      client.reply(msg.from, "pong", "whatsapp");
    }

    let handled = false;
    if (number === process.env.SYSTEM_PHONE) {
      if (msg.body.toLowerCase().startsWith("verify ")) {
        const phoneNumber = msg.body.split(" ")[1];
        console.log("verify phone", phoneNumber);
        if (msg.from.startsWith(phoneNumber)) {
          searchOne({ number: phoneNumber }, modelName).then((phoneModel) => {
            if (!phoneModel) {
              client.sendText(
                msg.from,
                "Phone number not found. To have your own bot using your number, or to know more about this WhatsApp bot, please contact the admin via email at foyzulkarim@gmail.com or facebook.com/foyzulkarim365"
              );
            } else {
              // eslint-disable-next-line no-param-reassign
              phoneModel.isVerified = true;
              update(phoneModel, modelName).then((updatedPhoneModel) => {
                console.log("phone verified", updatedPhoneModel);
                client.sendText(
                  msg.from,
                  "Your phone is now verified. You can activate your phone now."
                );
              });
            }
          });
        } else {
          client.sendText(
            msg.from,
            "Invalid number. Your device number did not match with the verification number. Please try again or type `help` to know more."
          );
        }
        handled = true;
      }
    }

    if (
      msg.body.toLowerCase() === "sos" ||
      msg.body.toLowerCase() === "`sos`"
    ) {
      let reply1 =
        "The receiver didn't setup the bot properly. Please contact the system administrator or type `know more`.";
      if (msg.to.startsWith(process.env.SYSTEM_PHONE)) {
        reply1 += `\n\n${verifyText}`;
      }
      client.sendText(msg.from, reply1);
      handled = true;
    }

    if (msg.body.toLowerCase() === "know more") {
      client.sendText(
        msg.from,
        "This hardcoded chatbot is built by Foyzul Karim. For dynamic logic for your  system, you can reach him via email at foyzulkarim@gmail.com or facebook.com/foyzulkarim365"
      );
      handled = true;
    }

    if (
      msg.body === "authenticated" ||
      msg.body ===
        "I am groot. I don't understand your words. Please type `sos` for more info."
    ) {
      handled = true;
    }

    if (!handled) {
      const toNumber = msg.to.replace("@c.us", "");
      searchOne({ number: toNumber, requestText: msg.body }, "Botengine").then(
        (responseText) => {
          if (responseText) {
            client.sendText(msg.from, responseText.responseText);
            handled = true;
          } else {
            client.sendText(
              msg.from,
              "I am groot. I don't understand your words. Please type `sos` for more info."
            );
          }
        }
      );
    }
    console.log("sending msg");
    if (!handled && !msg.isGroupMsg) {
      console.log("groot");
      client.sendText(
        msg.from,
        "I am groot. I don't understand your words. Please type `sos` for more info."
      );
    }
  });

  clients.push(client);
  searchOne({ number }, modelName).then((phoneModel) => {
    if (phoneModel) {
      // eslint-disable-next-line no-param-reassign
      phoneModel.isConnected = true;
      update(phoneModel, modelName).then((updatedPhoneModel) => {
        console.log("phone connected", updatedPhoneModel);
      });
    }
  });
}

const createClient = async (number, req, res) => {
  const existingClient = clients.find((c) => c.session === number);
  if (existingClient) {
    console.log("existing client", existingClient.session);
    if (res) {
      res.end();
    }
  }
  console.log("creating client ", number);
  const options = {
    multidevice: false, // for version not multidevice use false.(default: true)
    folderNameToken: ".tokens", // folder name when saving tokens
    // mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
    headless: true, // Headless chrome
    devtools: false, // Open devtools by default
    useChrome: true, // If false will use Chromium instance
    debug: false, // Opens a debug session
    logQR: false, // Logs QR automatically in terminal
    browserWS: "", // If u want to use browserWSEndpoint
    browserArgs: ["--no-sandbox"], // Original parameters  ---Parameters to be added into the chrome browser instance
    addBrowserArgs: ["--no-sandbox"], // Add broserArgs without overwriting the project's original
    puppeteerOptions: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--remote-debugging-port=9222",
      ],
    }, // Will be passed to puppeteer.launch
    disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
    disableWelcome: true, // Will disable the welcoming message which appears in the beginning
    updatesLog: false, // Logs info updates automatically in terminal
    autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
    createPathFileToken: false, // creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
    chromiumVersion: "982481", // Version of the browser that will be used. Revision strings can be obtained from omahaproxy.appspot.com.
    addProxy: [""], // Add proxy server exemple : [e1.p.webshare.io:01, e1.p.webshare.io:01]
    userProxy: "", // Proxy login username
    userPass: "", // Proxy password
  };

  const qrCatch = (base64Qrimg, asciiQR, attempts, urlCode) => {
    console.log("Number of attempts to read the qrcode: ", attempts);
    // console.log("Terminal qrcode: \n", asciiQR);
    // console.log('base64 image string qrcode: ', base64Qrimg);
    console.log("urlCode (data-ref): ", urlCode);
    if (res !== null && attempts === 1) {
      return res.status(200).send(urlCode);
    }
  };

  const statusFind = (status, s) => {
    console.log("Status: ", status, s);
    if (status === "qrReadSuccess") {
      // if (res) {
      //   res.end();
      // }
    }
  };

  const client = await venom.create(number, qrCatch, null, options, null, null);
  const device = await client.getHostDevice();
  console.log("client", device);
  start(client, number);
  return client;
};

const resetConnectedPhones = async () => {
  const phones = await dynamicSearch({ isVerified: true }, modelName);
  console.log("numbers", phones.length);
  await updateAll({ isVerified: true }, { isConnected: false }, modelName);
  const deletedDirectoryPaths = await del([".tokens"]);
  console.log("deletedDirectoryPaths", deletedDirectoryPaths);
};

const setup = async () => {
  eventEmitter = getEventEmitterInstance();
  eventEmitter.on("databaseConnectionEstablished", async () => {
    console.log("whatsapp.js=> databaseConnectionEstablished");
    console.log("whatsapp.js=> loadClients");
    await resetConnectedPhones();
  });

  eventEmitter.on("send-msg", (smsObj) => {
    console.log("send-msg received", smsObj); // 61492142082@c.us
    try {
      const { from } = smsObj;
      const client = clients.find((x) => from.startsWith(x.session));
      if (client) {
        client.sendText(smsObj.to, smsObj.body).then((message) => {
          console.log("message sent", message);
          eventEmitter.emit(`msg-sent`, { ...smsObj, ...message });
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  });
};

const getWhatsAppClientByNumber = (number) =>
  clients.find((x) => x.session === number);

module.exports = {
  createClient,
  setup,
  getWhatsAppClientByNumber,
};
