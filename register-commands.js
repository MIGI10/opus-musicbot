const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const config = require('./config.json');

module.exports = (globalDeploy) => {

    const commands = [];
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {

        const command = require(`./commands/${file}`);

        if (!globalDeploy) {
            commands.push(command.data.toJSON());
        }
        else if (!command.requirements.devOnly) {
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST({ version: '9' }).setToken(config.botToken);

    (async () => {

        try {

            console.log('Refreshing application (/) commands.');

            if (globalDeploy) {
                await rest.put(
                    Routes.applicationCommands(config.clientID),
                    { body: commands },
                );
            }
            else {
                await rest.put(
                    Routes.applicationGuildCommands(config.clientID, config.devGuildID),
                    { body: commands },
                );
            }

            console.log('Successfully reloaded application (/) commands.');

        } 
        catch (error) {

            console.error(error);
        }
    })();
}