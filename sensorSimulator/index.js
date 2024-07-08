const Sensor = require('./sensor');


console.log('Sensor Simulator started');

const tempSensor = new Sensor('Temperature Sensor', 'temp-sensor-1', 0, 100, 'ws://127.0.0.1:3000');
const tempSensor2 = new Sensor('Temperature Sensor', 'temp-sensor-2', 0, 100, 'ws://127.0.0.1:3000');
const tempSensor3 = new Sensor('Temperature Sensor', 'temp-sensor-3', 0, 100, 'ws://127.0.0.1:3000');


