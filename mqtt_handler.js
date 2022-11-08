const mqtt = require('mqtt')

const client = mqtt.connect("mqtt://82.165.65.202",{
    clientId: "host",
    username: "host",
    password: "Vy011195",
    clean: true
})

client.on('connect', () => {
    console.log('connected')
    client.end()
})

client.on('error', (err) => {
    console.log(err)
    client.end()
})