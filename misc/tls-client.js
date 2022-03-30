const tls = require("tls");
const fs = require("fs");
const path = require("path");

const options = {
  ca: fs.readFileSync(path.join(__dirname, "/../https/cert.pe")) // Only required because we are using a self-signed certificate
};

const outboundMessage = "ping";

const client = tls.connect(6000, options, () => {
  client.write(outboundMessage);

  client.on("data", (inboundMessage) => {
    const message = inboundMessage.toString();
    console.log(`I wrote ${outboundMessage} and they replied ${message}`);
    client.end();
  });
});