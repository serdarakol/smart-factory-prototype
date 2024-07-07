const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

const wss = new WebSocket.Server({ port: 3001 });
const db = new sqlite3.Database('./cloudData.sqlite');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS cloud_sensor_data (locality TEXT, sensor TEXT, id TEXT, value REAL, timestamp TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS cloud_command_data (action TEXT, timestamp TEXT, sent BOOLEAN)");
});

const processReceivedData = (data) => {
    console.log('Processing data:', data);
    db.run(`INSERT INTO cloud_sensor_data (locality, sensor, id, value, timestamp) VALUES (?, ?, ?, ?, ?)`, [data.locality, data.sensor, data.id, data.value, data.timestamp]);
};

const sendCommandToFog = async (command) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(command));
            console.log('Command sent to fog node');
            db.run(`UPDATE cloud_command_data SET sent = 1 WHERE action = ? AND timestamp = ?`, [command.action, command.timestamp]);
        }
    });
};

const receiveData = async () => {
    wss.on('connection', (ws) => {
        console.log('Fog node connected');

        ws.on('message', (message) => {
            const data = JSON.parse(message);
            processReceivedData(data);
        });

        ws.on('close', () => {
            console.log('Fog node disconnected');
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error: ${error.message}`);
        });

    });

};

const generateCommand = async () => {
    const command = { action: 'update', timestamp: new Date(), sent: false};
    db.run(`INSERT INTO cloud_command_data (action, timestamp, sent) VALUES (?, ?, ?)`, [command.action, command.timestamp, command.sent]);
    console.log('Command generated');
    await sendCommandToFog(command);
};

const processUnsentData = () => {
    db.all(`SELECT * FROM cloud_command_data WHERE sent = 0`, async (err, rows) => {
        if (err) {
            console.error('Error fetching unsent data:', err.message);
        } else {
            if(rows && rows.length > 0) {
                const rowPromises = rows.map(async (row) => {
                    await sendCommandToFog(row);
                });
                await Promise.all(rowPromises);
            }
        }
    });
};

receiveData();

setInterval( async () => {
    await generateCommand();
}, 3000);
// Process unsent data every 5 seconds
setInterval(processUnsentData, 6000);

console.log('Cloud server started');
