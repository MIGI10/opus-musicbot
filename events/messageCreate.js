module.exports = async (client, message) => {

    if (message.author.bot) return;

    if (!message.guild) {

        message.channel.send('Mensaje enviado al desarrollador, evita el uso incorrecto de este servicio o será bloqueado de usar el bot.\nMessage sent to the developer, avoid the misuse of this service or you will be blocked from using the bot.')

        client.channels.fetch(client.config.informChannel)
        .then(channel => {
            channel.send(`DM message:\n\nUser: <@${message.author.id}>\nContent: ${message.content}\n\n<@${client.config.botOwnerID}>`);
        });
    }
    else {

        if (message.content.startsWith('o!')) {

            const guild = await client.db.guild.findOne({
                id: message.guildId,
            }).catch(err => console.log(err));
        
            if (!guild && cmd.info.name !== 'config') {

                message.reply(strings['spa'].guildNotConfigured.replace('%PREFIX%', client.prefix) + '\n' + strings['eng'].guildNotConfigured.replace('%PREFIX%', client.prefix));
            }
            else {

                message.reply(strings[guild.language].useSlashCommands);
            }
        }
    }
}