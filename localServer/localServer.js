const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

const sensorWss = new WebSocket.Server({ port: 3000 });
const cloudWsUrl = 'ws://localhost:3001';

let cloudWs;
const db = new sqlite3.Database('./fogNodeData.sqlite');

// Initialize SQLite database
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS sensor_data (sensor TEXT, id TEXT, value REAL, timestamp TEXT, sent BOOLEAN)");
    db.run("CREATE TABLE IF NOT EXISTS received_command_data (action TEXT, timestamp TEXT)");
});

const connectToCloud = () => {
    cloudWs = new WebSocket(cloudWsUrl);

    cloudWs.on('open', () => {
        console.log('Connected to cloud');
        processUnsentData();
    });

    cloudWs.on('close', () => {
        console.log('Disconnected from cloud. Retrying to connect in 5 seconds...');
        setTimeout(() => connectToCloud(), 5000);
    });

    cloudWs.on('error', (error) => {
        console.error(`WebSocket error: ${error.message}`);
    });

    cloudWs.on('message', (message) => {
        const data = JSON.parse(message);
        const {sent, ...command} = data;
        console.log('Received command from cloud:', command);
        storeCloudCommand(data);
    });
};

const storeData = (data) => {
    db.run(`INSERT INTO sensor_data (sensor, id, value, timestamp, sent) VALUES (?, ?, ?, ?, ?)`, [data.sensor, data.id, data.value, data.timestamp, false]);
};

const storeCloudCommand = (command) => {
    db.run(`INSERT INTO received_command_data (action, timestamp) VALUES (?, ?)`, [command.action, command.timestamp]);
};

const sendDataToCloud = async (data) => {
    try{
        if (cloudWs.readyState === WebSocket.OPEN) {
            data.locality = 'fog-node-1' //process.env.LOCALITY;
            cloudWs.send(JSON.stringify(data));
            db.run(`UPDATE sensor_data SET sent = 1 WHERE sensor = ? AND id = ? AND value = ? AND timestamp = ?`, [data.sensor, data.id, data.value, data.timestamp]);
            console.log('Data sent to cloud:', data);
        } else {
            console.error('WebSocket to cloud is not open. Data could not be sent, and saved as unsent data.');
        }
    } catch(error) {
        console.error(`Error sending data to cloud: ${error.message}. data could not be sent, and saved as unsent data.`);
        db.run(`UPDATE sensor_data SET sent = 0 WHERE sensor = ? AND id = ? AND value = ? AND timestamp = ?`, [data.sensor, data.id, data.value, data.timestamp]);
    }
}

sensorWss.on('connection', (ws) => {
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
                });
                await Promise.all(rowPromises);
            }
        }
    });
};

connectToCloud();
setInterval(processUnsentData, 5000);

console.log('Fog node server started on port 3000');
