module.exports = async (client, message) => {

    if (message.author.bot) return;

    if (!message.guild) {

        message.channel.send('Mensaje enviado al desarrollador, evita el uso incorrecto de este servicio o será bloqueado de usar el bot.\nMessage sent to the developer, avoid the misuse of this service or you will be blocked from using the bot.')

        client.channels.fetch(client.config.informChannel)
        .then(channel => {
            channel.send(`DM message:\n\nUser: <@${message.author.id}>\nContent: ${message.content}\n\n<@${client.config.botOwnerID}>`);
        });

        return
    }

    if (!message.content.toLowerCase().startsWith(client.prefix)) return;

    const args = message.content.split(/ +/g);
    
    const command = args.shift().slice(client.prefix.length).toLowerCase();

    const cmd = client.commands.get(command)?
        client.commands.get(command):
        client.cmdaliases.get(command)

    if (!cmd) return;

    const guild = await client.db.guild.findOne({ 
        id: message.guild.id,
    }).catch(err => console.log(err));

    if (!guild && cmd.info.name !== 'config') {
        return message.channel.send(strings['spa'].guildNotConfigured.replace('%PREFIX%', client.prefix) + '\n' + strings['eng'].guildNotConfigured.replace('%PREFIX%', client.prefix));
    }

    if (!message.guild.me.permissions.has(["SEND_MESSAGES"]) && !message.channel.permissionsFor(message.member).has('SEND_MESSAGES', false)) return;

    const isMod = message.member.roles.cache.has(client.config.modRoleID);

    if (cmd.requirements.devOnly && !client.config.botOwnerID.includes(message.author.id)) return

    if (cmd.requirements.modOnly && !isMod && !client.config.botOwnerID.includes(message.author.id))
        return message.reply(strings[guild.language].botRestrictedCommand)
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete() 
            }, 5000))
    
    if (cmd.requirements.userPerms && !message.member.permissions.has(cmd.requirements.userPerms))
        return message.reply(strings[guild.language].userNeedsPerms.replace('%PERMS%', cmd.requirements.userPerms.join(' ')))
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete() 
            }, 10000))

    if (cmd.requirements.clientPerms && !message.guild.me.permissions.has(cmd.requirements.clientPerms))
        return message.reply(strings[guild.language].botNeedsPerms.replace('%PERMS%', cmd.requirements.clientPerms.join(' ')))
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete() 
            }, 10000))

    cmd.run(client, message, args, guild);
}

    