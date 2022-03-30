const dgram = require("dgram");

const client = dgram.createSocket("udp4");

const messageString = "This is a message";
const messageBuffer = Buffer.from(messageString);

client.send(messageBuffer, 6000, "localhost", (err) => {
  client.close();
});