// server.js
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

const wss = new WebSocket.Server({ port: 3000 });
const db = new sqlite3.Database(':memory:');

// Initialize SQLite database
db.serialize(() => {
    db.run("CREATE TABLE sensor_data (sensor TEXT, id TEXT, value REAL, timestamp TEXT, sent BOOLEAN)");
});

const storeData = (data) => {
    db.run(`INSERT INTO sensor_data (sensor, id, value, timestamp, sent) VALUES (?, ?, ?, ?, ?)`, [data.sensor, data.id, data.value, data.timestamp, false]);
};

wss.on('connection', (ws) => {
    console.log('Sensor connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received data:', data);
        storeData(data);
    });

    ws.on('close', () => {
        console.log('Sensor disconnected');
    });

    ws.on('error', (error) => console.error(`WebSocket error: ${error.message}`));
});

console.log('Fog node server started on port 3000');
