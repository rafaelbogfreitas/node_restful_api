const net = require("net");

const server = net.createServer((connection) => {
  const outbondMessage = "pong";
  connection.write(outbondMessage);

  connection.on("data", (inboundMessage) => {
    const message = inboundMessage.toString();
    console.log(`I wrote ${outbondMessage} and they replied ${message}`);
  });
});

server.listen(6000);