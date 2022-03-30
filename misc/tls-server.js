const tls = require("tls");
const fs = require("fs");
const path = require("path");

const options = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pe"))
};

const server = tls.createServer(options, (connection) => {
  const outbondMessage = "pong";
  connection.write(outbondMessage);

  connection.on("data", (inboundMessage) => {
    const message = inboundMessage.toString();
    console.log(`I wrote ${outbondMessage} and they replied ${message}`);
  });
});

server.listen(6000);