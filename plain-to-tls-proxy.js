const net = require('net');
const tls = require('tls');
const fs = require('fs');

const listenPort = 80;

const targetHost = 'localhost';
const targetPort = 443;

const logFile = fs.createWriteStream('proxy.log', { flags: 'a' });

// log with timestamp
function log(message) {
  let date = new Date();
  let time = date.toLocaleString();

  const line = `[${time}] ${message}\n`

  logFile.write(line);
  console.log(line);
}

const server = net.createServer((client) => {
  // Log the client connection
  let clientAddress = client.remoteAddress + ':' + client.remotePort;
  log(`Client connected from ${clientAddress}`);

  // Create a socket to connect to the target host
  const options = {
    host: targetHost,
    port: targetPort,
    rejectUnauthorized: false
  };
  const target = tls.connect(options, () => {
    // Log the target connection
    log(`Target connected to ${targetHost}:${targetPort}`);

    // Pipe the data between the client and the target
    client.pipe(target).pipe(client);

    // Log the data sent and received
    client.on('data', (data) => {
      log(`Client sent: ${data.toString('utf8')}`);
    });
    target.on('data', (data) => {
      log(`Target sent: ${data.toString('utf8')}`);
    });
  });

  // Handle the errors and close events
  client.on('error', (err) => {
    log(`Client error: ${err.message}`);
    client.destroy();
    target.destroy();
  });
  target.on('error', (err) => {
    log(`Target error: ${err.message}`);
    client.destroy();
    target.destroy();
  });
  client.on('close', () => {
    log(`Client disconnected from ${clientAddress}`);
    target.destroy();
  });
  target.on('close', () => {
    log(`Target disconnected from ${targetHost}:${targetPort}`);
    client.destroy();
  });
});


log(`Start listening..`);
server.listen(listenPort, () => {
  log(`Server listening on port ${listenPort}`);
});
