const regCommands = require('../register-commands.js');
const loadCommands = require('../loaders/command');
const loadEvents = require('../loaders/event');
const { readdirSync } = require('fs');
const { join } = require('path');
const eventsFolder = join(__dirname, "..", "events");

module.exports.run = async (client, interaction) => {

    if (interaction.options.getInteger('global') == 1) {
        regCommands(true); 
    }
    else {
        regCommands(false);
    }

    delete require.cache['/usr/src/bot/spotify/reqContent.js'];

    await client.commands.clear();

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

    interaction.reply('Successfully reloaded commands, events, lang and spotify module!');
}

module.exports.data = new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload commands, events, lang and spotify module.')
    .addIntegerOption(option =>
        option.setName('global')
            .setRequired(true)
            .setDescription('Refresh commands globally (1) or not (0).')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: true
}