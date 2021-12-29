const { readdirSync } = require('fs');
const { join } = require('path');
const filePath = join(__dirname, "..", "events");

module.exports.run = (client) => {

    const eventFiles = readdirSync(filePath);

    for (const eventFile of eventFiles) {

        const eventPath = `${filePath}/${eventFile}`;
        delete require.cache[eventPath];
        const event = require(eventPath);

        const eventName = eventFile.split(".").shift();
        client.on(eventName, event.bind(null, client));
    }
    console.log(`Loaded ${eventFiles.length} events!`);
}