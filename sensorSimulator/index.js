const Sensor = require('./sensor');


console.log('Sensor Simulator started');

const tempSensor = new Sensor('Temperature Sensor', 'temp-sensor-1', 0, 100, 'ws://127.0.0.1:3000');
const humiditySensor = new Sensor('Humidity Sensor', 'humidity-sensor-1', 0, 100, 'ws://127.0.0.1:3000');


