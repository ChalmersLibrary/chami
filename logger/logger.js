const fetch = require("node-fetch");

module.exports = class Logger {
  constructor() {
    this.logstashBaseUrl = process.env.LogstashBaseUrlWithHttps;
    this.logstashUsername = process.env.LogstashUsername;
    this.logstashPassword = process.env.LogstashPassword;
    this.source = "chami";
  }

  async sendToLogstash(data) {
    if (this.logstashBaseUrl) {
      try {
        const encodedLogin = Buffer.from(this.logstashUsername + ":" +
          this.logstashPassword, "binary").toString("base64");
        const response = await fetch(this.logstashBaseUrl, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Authorization": "Basic " + encodedLogin,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          throw new Error("Response was (" + response.status + "): " +
            await response.text());
        }
      } catch (error) {
        // this.context.log.error("Failed to send log message to Logstash", error)
      }
    }
  }

  async info(msg) {
    await this.sendToLogstash({
      Type: "Info",
      Time: new Date().toISOString(),
      Source: this.source,
      Message: msg
    });
  }
  
  async warn(msg) {
    await this.sendToLogstash({
      Type: "Warning",
      Time: new Date().toISOString(),
      Source: this.source,
      Message: msg
    });
  }

  async error(msg, exception) {
    await this.sendToLogstash({
      Type: "Error",
      Time: new Date().toISOString(),
      Source: this.source,
      Message: msg + (exception ? ": " + exception.message : ""),
      Exception: exception
    });
  }
};
