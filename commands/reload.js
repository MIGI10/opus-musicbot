const loadCommands = require('../structures/command');
const loadEvents = require('../structures/event');
const { readdirSync } = require('fs');
const { join } = require('path');
const eventsFolder = join(__dirname, "..", "events");

module.exports.run = async (client, message, args) => {

    delete require.cache['/usr/src/bot/spotify/reqContent.js'];

    await client.commands.clear();
    await client.cmdaliases.clear();

    loadCommands.run(client);

    for await (const eventFile of readdirSync(eventsFolder)) {
        const eventName = eventFile.split(".").shift();
        client.removeAllListeners(eventName);
    }

    loadEvents.run(client);

    delete require.cache['/usr/src/bot/lang/eng.json'];
    delete require.cache['/usr/src/bot/lang/spa.json'];

    const engStrings = require('/usr/src/bot/lang/eng.json');
    const spaStrings = require('/usr/src/bot/lang/spa.json');

    strings['eng'] = engStrings;
    strings['spa'] = spaStrings;

    message.channel.send('Successfully reloaded commands, events, lang and spotify module!');
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