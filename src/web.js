"use strict";

const { Builder, until, By, Key, Capabilities } = require("selenium-webdriver");

class Web {
  constructor(browser, site) {
    this.site = site;
    this.browser = browser;
  }
  async init() {
    let caps = new Capabilities();
    caps.setPageLoadStrategy("eager");
    this.driver = await new Builder()
      .withCapabilities(caps)
      .forBrowser(this.browser)
      .build();
  }

  async connect() {
    await this.driver.get(this.site);
  }
  async quit() {
    await this.driver.quit();
  }
  //CSS Query
  async click(cssQuery) {
    await this.driver.findElement(By.css(cssQuery)).click();
  }
  async send(cssQuery, text) {
    for (let i = 0; i < text.length; i++) {
      if (text[i].includes("K.")) {
        text[i] = Key[text[i].slice(2)];
      }
    }
    await this.driver.findElement(By.css(cssQuery)).sendKeys(...text);
  }
  async clear(cssQuery) {
    await this.driver.findElement(By.css(cssQuery)).clear();
  }
  async getContent(cssQuery) {
    const elements = await this.driver.findElements(By.css(cssQuery));
    let content = [];
    for (let el of elements) {
      content.push(await el.getText());
    }
    return content;
  }
  async getElements(cssQuery) {
    const elements = await this.driver.findElements(By.css(cssQuery));
    return elements;
  }
  async filterOneAndClick(query, name) {
    const contacts = await this.getElements(query);
    for (let contact of contacts) {
      const text = await contact.getText();
      if (text.includes(name)) {
        await contact.click();
        return;
      }
    }
  }

  async filterOneAndValidateQuery(query, name, queryToValidate) {
    const contacts = await this.getElements(query);
    for (let contact of contacts) {
      const text = await contact.getText();
      if (text.includes(name)) {
        try {
          await contact.findElement(By.css(queryToValidate));
          return true;
        } catch (err) {
          return false;
        }
      }
    }
  }
  async runScript(script) {
    await this.driver.executeScript(script);
  }
}
module.exports = Web;
