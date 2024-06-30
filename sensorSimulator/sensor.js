const WebSocket = require('ws');

class Sensor {
    constructor(name, sensorId, min, max, localComponentUrl) {
        this.name = name;
        this.sensorId = sensorId;
        this.min = min;
        this.max = max;
        this.localComponentUrl = localComponentUrl;
        this.unsentData = [];
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
            this.sendUnsentData();
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
            this.unsentData.push(data);
            this.sendData();
        }, 2000);
    }

    sendData() {
        if(this.ws.readyState === WebSocket.OPEN) {
            while(this.unsentData.length > 0) {
                const data = this.unsentData.shift();
                this.ws.send(JSON.stringify(data));
                console.log(`Sensor ${this.name} (${this.sensorId}) sent data: ${JSON.stringify(data)}`);
            }
        }
    }

    sendUnsentData() {
        this.sendData();
    }

}

module.exports = Sensor;