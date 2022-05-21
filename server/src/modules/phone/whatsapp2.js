// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
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
    console.log("message", msg.from, msg.body);
    if (msg.body === "!ping") {
      client.reply(msg.from, "pong", "whatsapp");
    }

    if (msg.body.toLowerCase() === "hi" && msg.isGroupMsg === false) {
      client
        .sendText(msg.from, "Welcome Venom 🕷")
        .then((result) => {
          console.log("Result: ", result); // return object success
        })
        .catch((erro) => {
          console.error("Error when sending: ", erro); // return object error
        });
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
      msg.body.toLowerCase() === "help" ||
      msg.body.toLowerCase() === "`help`"
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
      client.sendText(
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
      client.sendText(
        msg.from,
        "I am groot. I don't understand your words. Please type `help` for more info."
      );
    }
  });
}

const createClient = async (number, req, res) => {
  console.log("creating client ", number);
  const options = {
    multidevice: true, // for version not multidevice use false.(default: true)
    folderNameToken: ".tokens", // folder name when saving tokens
    // mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
    headless: true, // Headless chrome
    devtools: false, // Open devtools by default
    useChrome: true, // If false will use Chromium instance
    debug: false, // Opens a debug session
    logQR: false, // Logs QR automatically in terminal
    browserWS: "", // If u want to use browserWSEndpoint
    browserArgs: [""], // Original parameters  ---Parameters to be added into the chrome browser instance
    addBrowserArgs: [""], // Add broserArgs without overwriting the project's original
    puppeteerOptions: {}, // Will be passed to puppeteer.launch
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
    console.log("Terminal qrcode: ", asciiQR);
    // console.log('base64 image string qrcode: ', base64Qrimg);
    console.log("urlCode (data-ref): ", urlCode);
    if (res) {
      res && res.write(urlCode);
    }
  };

  const client = await venom.create(number, qrCatch, null, options, null, null);
  const device = await client.getHostDevice();
  console.log("client", device);
  start(client, number);
};

const createClient2 = (number) => {
  console.log("creating client ", number);
  venom
    .create(
      // session
      number, // Pass the name of the client you want to start the bot
      // catchQR
      (base64Qrimg, asciiQR, attempts, urlCode) => {
        console.log("Number of attempts to read the qrcode: ", attempts);
        console.log("Terminal qrcode: ", asciiQR);
        // console.log('base64 image string qrcode: ', base64Qrimg);
        console.log("urlCode (data-ref): ", urlCode);
        if (res) {
          res && res.write(urlCode);
        }
      },
      // statusFind
      (statusSession, session) => {
        console.log("Status Session: ", statusSession); // return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken || chatsAvailable || deviceNotConnected || serverWssNotConnected || noOpenBrowser || initBrowser || openBrowser || connectBrowserWs || initWhatsapp || erroPageWhatsapp || successPageWhatsapp || waitForLogin || waitChat || successChat
        // Create session wss return "serverClose" case server for close
        console.log("Session name: ", session);
      },
      // options
      {
        multidevice: true, // for version not multidevice use false.(default: true)
        folderNameToken: ".tokens", // folder name when saving tokens
        // mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
        headless: true, // Headless chrome
        devtools: false, // Open devtools by default
        useChrome: true, // If false will use Chromium instance
        debug: false, // Opens a debug session
        logQR: true, // Logs QR automatically in terminal
        browserWS: "", // If u want to use browserWSEndpoint
        browserArgs: [""], // Original parameters  ---Parameters to be added into the chrome browser instance
        addBrowserArgs: [""], // Add broserArgs without overwriting the project's original
        puppeteerOptions: {}, // Will be passed to puppeteer.launch
        disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
        disableWelcome: true, // Will disable the welcoming message which appears in the beginning
        updatesLog: true, // Logs info updates automatically in terminal
        autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
        createPathFileToken: false, // creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
        chromiumVersion: "982481", // Version of the browser that will be used. Revision strings can be obtained from omahaproxy.appspot.com.
        addProxy: [""], // Add proxy server exemple : [e1.p.webshare.io:01, e1.p.webshare.io:01]
        userProxy: "", // Proxy login username
        userPass: "", // Proxy password
      }
      // BrowserSessionToken
      // To receive the client's token use the function await clinet.getSessionTokenBrowser()
      // {
      //     WABrowserId: '"UnXjH....."',
      //     WASecretBundle:
      //         '{"key":"+i/nRgWJ....","encKey":"kGdMR5t....","macKey":"+i/nRgW...."}',
      //     WAToken1: '"0i8...."',
      //     WAToken2: '"1@lPpzwC...."'
      // },
      // // BrowserInstance
      // (browser, waPage) => {
      //     console.log('Browser PID:', browser.process().pid);
      //     waPage.screenshot({ path: 'screenshot.png' });
      // }
    )
    .then((client) => start(client, number))
    .catch((error) => {
      console.log(error);
    });
};

const loadClients = async () => {
  const phones = await dynamicSearch({ isVerified: true }, modelName);
  console.log("numbers", phones.length);
  for (let index = 0; index < phones.length; index++) {
    const { number } = phones[index];
    console.log("number", number);
    if (number === process.env.SYSTEM_PHONE) {
      console.log("creating client ", number);
      await createClient(number);
    }
  }

  if (phones.length === 0) {
    console.log("No phones found. setting up system phone");
    const phone = {
      number: process.env.SYSTEM_PHONE,
      isVerified: true,
      alias: "System",
    };

    const p = save(phone, modelName);
    await createClient(process.env.SYSTEM_PHONE, null, null);
  }
};

const loadClientsPromise = () => {
  dynamicSearch({ isVerified: true }, modelName).then((phones) => {
    console.log("numbers", phones.length);
    for (let index = 0; index < phones.length; index++) {
      const { number } = phones[index];
      console.log("number", number);
      if (number === process.env.SYSTEM_PHONE) {
        createClient(number);
      }
    }
    if (phones.length === 0) {
      console.log("No phones found. setting up system phone");
      const phone = {
        number: process.env.SYSTEM_PHONE,
        isVerified: true,
        alias: "System",
      };
      save(phone, modelName).then(() => {
        createClient(process.env.SYSTEM_PHONE, null, null);
      });
    }
  });
};

const setup = async () => {
  eventEmitter = getEventEmitterInstance();
  eventEmitter.on("databaseConnectionEstablished", async () => {
    console.log("whatsapp.js=> databaseConnectionEstablished");
    console.log("whatsapp.js=> loadClients");
    // await loadClients();
  });
};

module.exports = { createClient, setup };
