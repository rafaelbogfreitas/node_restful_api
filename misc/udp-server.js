const dgram = require("dgram");

const server = dgram.createSocket("udp4");

server.on("message", (messageBuffer, sender) => {
  const message = messageBuffer.toString();
  console.log(message);
});

server.bind(6000);