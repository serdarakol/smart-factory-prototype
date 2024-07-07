const WebSocket = require('ws');

class Sensor {
    constructor(name, sensorId, min, max, localComponentUrl) {
        this.name = name;
        this.sensorId = sensorId;
        this.min = min;
        this.max = max;
        this.localComponentUrl = localComponentUrl;
        this.isGeneratingData = false;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.localComponentUrl);

        if(!this.isGeneratingData) {
            this.startGeneratingData();
        }

        this.ws.on('open', () => {
            console.log(`Sensor ${this.name} (${this.sensorId}) connected to ${this.localComponentUrl}`);
        });

        this.ws.on('close', () => {
            console.log(`Sensor ${this.name} (${this.sensorId}) disconnected from ${this.localComponentUrl}`);
            console.log('Retrying to connect in 5 seconds...');
            setTimeout(() => this.connect(), 5000);
        });

        this.ws.on('error', (error) => {
            console.log(`Sensor ${this.name} (${this.sensorId}) error: ${error}`);
        });
    }

    startGeneratingData() {
        this.isGeneratingData = true;
        console.log(`Sensor ${this.name} (${this.sensorId}) started generating data`);
        setInterval(() => {
            const value = (Math.random() * (this.max - this.min) + this.min).toFixed(2);
            const data = {sensor: this.name, id: this.sensorId, value: parseFloat(value), timestamp: new Date()};
            this.sendData(data);
        }, 2000);
    }

    sendData(data) {
        if(this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            console.log(`Sensor ${this.name} (${this.sensorId}) sent data: ${JSON.stringify(data)}`);
        }
    }

}

module.exports = Sensor;