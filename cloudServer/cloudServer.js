const zmq = require('zeromq');

// ZeroMQ setup for receiving data from fog nodes and sending commands to fog nodes
const pullSock = new zmq.Pull();
const pushSock = new zmq.Push();

const start = async () => {
    pushSock.connect('tcp://127.0.1:3002');
};

const processReceivedData = (data) => {
    console.log('Processing data:', data);
    // Add your data processing logic here (e.g., store in a database, perform analytics)
};

const sendCommandToFog = async (command) => {
    try {
        await pushSock.send(JSON.stringify(command));
        console.log('Command sent to fog:', command);
    } catch (err) {
        console.error('Error sending command to fog:', err.message);
    }
};

const receiveData = async () => {
    await pullSock.bind('tcp://127.0.1:3001');

    for await (const [msg] of pullSock) {
        const data = JSON.parse(msg.toString());
        console.log('Received data from fog:', data);
        processReceivedData(data);
    }
};

start().catch((err) => console.error('Error starting ZeroMQ:', err.message));
receiveData().catch((err) => console.error('Error receiving data:', err.message));

// Example command to be sent to fog nodes periodically

setInterval(async () => {
    const command = { action: 'update', timestamp: new Date() };
    await sendCommandToFog(command);
}, 1000);

console.log('Cloud server started');
