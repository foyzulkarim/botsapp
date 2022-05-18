// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require('venom-bot');
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

function start(client) {
    console.log('starting', client);
    client.onMessage((message) => {
        console.log('message', message);
        if (message.body === 'Hi' && message.isGroupMsg === false) {
            client
                .sendText(message.from, 'Welcome Venom 🕷')
                .then((result) => {
                    console.log('Result: ', result); //return object success
                })
                .catch((erro) => {
                    console.error('Error when sending: ', erro); //return object error
                });
        }
    });
}

const createClient = (number, req, res) => {
    console.log('creating client ', number);
    venom
        .create( //session
            number, //Pass the name of the client you want to start the bot
            //catchQR
            (base64Qrimg, asciiQR, attempts, urlCode) => {
                console.log('Number of attempts to read the qrcode: ', attempts);
                console.log('Terminal qrcode: ', asciiQR);
                // console.log('base64 image string qrcode: ', base64Qrimg);
                console.log('urlCode (data-ref): ', urlCode);
                if (res) {
                    res && res.write(urlCode);
                }
            },
            // statusFind
            (statusSession, session) => {
                console.log('Status Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken || chatsAvailable || deviceNotConnected || serverWssNotConnected || noOpenBrowser || initBrowser || openBrowser || connectBrowserWs || initWhatsapp || erroPageWhatsapp || successPageWhatsapp || waitForLogin || waitChat || successChat
                //Create session wss return "serverClose" case server for close
                console.log('Session name: ', session);
            },
            // options
            {
                multidevice: true, // for version not multidevice use false.(default: true)
                folderNameToken: '.tokens', //folder name when saving tokens
                // mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
                headless: true, // Headless chrome
                devtools: false, // Open devtools by default
                useChrome: true, // If false will use Chromium instance
                debug: false, // Opens a debug session
                logQR: true, // Logs QR automatically in terminal
                browserWS: '', // If u want to use browserWSEndpoint
                browserArgs: [''], // Original parameters  ---Parameters to be added into the chrome browser instance
                addBrowserArgs: [''], // Add broserArgs without overwriting the project's original
                puppeteerOptions: {}, // Will be passed to puppeteer.launch
                disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
                disableWelcome: true, // Will disable the welcoming message which appears in the beginning
                updatesLog: true, // Logs info updates automatically in terminal
                autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
                createPathFileToken: false, // creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
                chromiumVersion: '982481', // Version of the browser that will be used. Revision strings can be obtained from omahaproxy.appspot.com.
                addProxy: [''], // Add proxy server exemple : [e1.p.webshare.io:01, e1.p.webshare.io:01]
                userProxy: '', // Proxy login username
                userPass: '' // Proxy password
            },
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
        .then((client) => start(client))
        .catch((error) => {
            console.log(error);
        });
}

const createClient2 = (number) => {
    venom.create(number).then((client) => {
        client.onMessage((message) => {
            console.log('message2', message);
            if (message.body === 'Hi' && message.isGroupMsg === false) {
                client
                    .sendText(message.from, 'Welcome Venom 2 🕷')
                    .then((result) => {
                        console.log('Result: ', result); //return object success
                    })
                    .catch((erro) => {
                        console.error('Error when sending: ', erro); //return object error
                    });
            }
        });
    });
}

const loadClients = () => {
    dynamicSearch(
        { isVerified: true },
        modelName
    ).then(phones => {
        console.log("numbers", phones.length);
        for (let index = 0; index < phones.length; index++) {
            const { number } = phones[index];
            console.log('number', number);
            //createClient(number);
        }
        if (phones.length === 0) {
            console.log("No phones found. setting up system phone");
            const phone = {
                number: process.env.SYSTEM_PHONE,
                isVerified: true,
                alias: "System",
            };
            // await save(phone, modelName);
            // createClient(process.env.SYSTEM_PHONE, null, null);
        }
    });
};

const setup = () => {
    eventEmitter = getEventEmitterInstance();
    eventEmitter.on("databaseConnectionEstablished", () => {
        console.log("whatsapp.js=> databaseConnectionEstablished");
        console.log("whatsapp.js=> loadClients");
        loadClients();
    });
};

module.exports = { createClient, setup }