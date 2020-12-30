const path = require("path");

class Config {
  constructor(browser) {
    this.browser = browser;
    this.init();
  }
  init() {
    switch (this.browser) {
      case "chrome":
        this.configChrome();
        break;
      case "firefox":
        this.configFirefox();
        break;
      default:
        this.configChrome();
        this.configFirefox();
        break;
    }
  }
  configChrome() {
    const chrome = require("selenium-webdriver/chrome");
    chrome.setDefaultService(
      new chrome.ServiceBuilder(
        path.resolve(__dirname, "../chromedriver")
      ).build()
    );
  }
  configFirefox() {
    const firefox = require("selenium-webdriver/firefox");
    new firefox.Options().setBinary("geckodriver");
  }
}

module.exports = Config;
