"use strict";

const Web = require("./src/web.js");
const Config = require("./src/config.js");
const Contact = require("./src/contact.js");
const UserConfig = require("./config.json");

const TIME_TO_LOGIN = UserConfig.TIME_TO_LOGIN; //Seconds
const CONTACT_NAMES_IGNORED = UserConfig.CONTACT_NAMES_IGNORED; //i.e: 'Paul','George',etc
const CONTACT_TO_STAY_WATCHING = UserConfig.CONTACT_TO_STAY_WATCHING; //Contact name than WhatsBot can sleep, a dead chat.
const WHATSAPP_BROWSER = UserConfig.WHATSAPP_BROWSER;
const CLEVERBOT_BROWSER = UserConfig.CLEVERBOT_BROWSER;

if (!CONTACT_TO_STAY_WATCHING) {
  console.error(
    "Requires a dead whatsapp chat name that the bot can sleep and stay watching, complete it in config.json in this dir"
  );
  process.exit();
}

let UNREAD_CONTACTS = []; //Auto fill
//SQL Needed

(async function() {
  if (
    (WHATSAPP_BROWSER == "chrome" && CLEVERBOT_BROWSER == "firefox") ||
    (WHATSAPP_BROWSER == "firefox" && CLEVERBOT_BROWSER == "chrome")
  ) {
    new Config("both"); //Browser to use: "chrome" or "firefox" or "both"
  } else {
    new Config(WHATSAPP_BROWSER);
  }

  let whatsapp = new Web(WHATSAPP_BROWSER, "https://web.whatsapp.com");
  await whatsapp.init();
  await whatsapp.connect();

  let cleverbot = new Web(CLEVERBOT_BROWSER, "https://www.cleverbot.com");
  await cleverbot.init();
  await cleverbot.connect();
  await cleverbot.click("#note input");

  let loginInterval = TIME_TO_LOGIN;
  setInterval(() => {
    if (loginInterval == 0) return;
    console.log(
      `You have to login with WhatsApp QR, ${loginInterval} seconds remaining`
    );
    loginInterval--;
  }, 1000);

  setTimeout(async () => {
    while (true) {
      UNREAD_CONTACTS = await updateContacts(whatsapp);
      if (UNREAD_CONTACTS.length > 0) {
        for (let contact of UNREAD_CONTACTS) {
          let messageToRespond = contact.lastMsg;
          if (
            messageToRespond.includes("escribiendo...") ||
            messageToRespond.includes("typing...")
          ) {
            continue;
          }
          console.log(`Q => ${messageToRespond}`);
          let response = await contactCleverbot(cleverbot, messageToRespond);
          console.log(`A => ${response}`);
          await respondMsg(whatsapp, contact.name, response);
        }
      } else {
        await whatsapp.filterOneAndClick("._1MZWu", CONTACT_TO_STAY_WATCHING);
      }
    }
  }, TIME_TO_LOGIN * 1000);
})();

async function updateContacts(whatsapp) {
  const chats = await whatsapp.getContent("._1MZWu");
  const contacts = [];
  for (let chat of chats) {
    const chatSplitted = chat.split("\n");
    //Group validation
    let name, lastMsg, isUnread;
    if (chatSplitted[3] == ": ") {
      name = chatSplitted[0];
      lastMsg = chatSplitted[4];
      isUnread = chatSplitted.length > 5 ? true : false;
    } else {
      name = chatSplitted[0];
      lastMsg = chatSplitted[2];
      isUnread = chatSplitted.length > 3 ? true : false;
    }

    let isIgnored = false;
    for (let ignored of CONTACT_NAMES_IGNORED) {
      if (name == ignored) {
        isIgnored = true;
      }
    }
    if (!isIgnored && isUnread) {
      const contact = new Contact(name, lastMsg);
      contacts.push(contact);
    }
  }
  return contacts;
}

async function contactCleverbot(cleverbot, question) {
  await cleverbot.send(".stimulus", [question, "K.ENTER"]);
  const waitPromise = new Promise((res, rej) => {
    setTimeout(async () => {
      let answer = await cleverbot.getContent("#line1 .bot");
      res(answer);
    }, 5000);
  });
  let answer = await Promise.resolve(waitPromise);
  return answer[0];
}

async function respondMsg(whatsapp, name, response) {
  await whatsapp.filterOneAndClick("._1MZWu", name);
  await whatsapp.click("._2HE1Z._1hRBM");
  await whatsapp.send("._2HE1Z._1hRBM ._1awRl", [response, "K.ENTER"]);
}
