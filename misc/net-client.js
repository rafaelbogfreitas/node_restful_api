const net = require("net");

const outboundMessage = "ping";

const client = net.createConnection({ port: 6000 }, () => {
  client.write(outboundMessage);

  client.on("data", (inboundMessage) => {
    const message = inboundMessage.toString();
    console.log(`I wrote ${outboundMessage} and they replied ${message}`);
    client.end();
  });
});