const loadCommands = require('../structures/command');
const loadEvents = require('../structures/event');
const { readdirSync } = require('fs');
const { join } = require('path');
const filePath = join(__dirname, "..", "events");

module.exports.run = async (client, message, args) => {

    await client.commands.clear();
    await client.cmdaliases.clear();

    loadCommands.run(client);

    for await (const eventFile of readdirSync(filePath)) {
        const eventName = eventFile.split(".").shift();
        client.removeAllListeners(eventName);
    }

    loadEvents.run(client);

    message.channel.send('Successfully reloaded events and commands!');
}

module.exports.info = {
    name: "reload",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: true
}