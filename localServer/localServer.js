// server.js
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const zmq = require('zeromq');

const wss = new WebSocket.Server({ port: 3000 });
const db = new sqlite3.Database(':memory:');

// TODO: Create a socket for incoming data from cloud

const sock = new zmq.Push();
const run = async () => {
    sock.connect('tcp://127.0.1:3001');
    console.log('Producer bound to port 3001');
};


// Initialize SQLite database
db.serialize(() => {
    db.run("CREATE TABLE sensor_data (sensor TEXT, id TEXT, value REAL, timestamp TEXT, sent BOOLEAN)");
});

const storeData = (data) => {
    db.run(`INSERT INTO sensor_data (sensor, id, value, timestamp, sent) VALUES (?, ?, ?, ?, ?)`, [data.sensor, data.id, data.value, data.timestamp, false]);
};

const sendDataToCloud = async (data) => {
    try{
        await sock.send(JSON.stringify(data));
        console.log('Data sent to cloud:', data);
    } catch(error) {
        console.error(`Error sending data to cloud: ${error.message}`);
    }
}

wss.on('connection', (ws) => {
    console.log('Sensor connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received data:', data);
        storeData(data);
        sendDataToCloud(data);
    });

    ws.on('close', () => {
        console.log('Sensor disconnected');
    });

    ws.on('error', (error) => console.error(`WebSocket error: ${error.message}`));
});

const processUnsentData = () => {
    db.all(`SELECT * FROM sensor_data WHERE sent = 0`, async (error, rows) => {
        if(error) {
            console.error(`Error getting unsent data: ${error.message}`);
        } else {
            if(rows && rows.length > 0) {
                const rowPromises = rows.map(async (row) => {
                    await sendDataToCloud(row);
                    db.run(`UPDATE sensor_data SET sent = 1 WHERE sensor = ? AND id = ? AND value = ? AND timestamp = ?`, [row.sensor, row.id, row.value, row.timestamp]);
                });
                await Promise.all(rowPromises);
            }
        }
    });
};

run().catch((err) => console.error('Error running producer:', err.message));
setInterval(processUnsentData, 5000);

console.log('Fog node server started on port 3000');
