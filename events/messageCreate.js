module.exports = (client, message) => {

    if (message.author.bot) return;

    if (!message.guild) {

        message.channel.send('Se ha enviado tu mensaje al desarrollador del bot, ten paciencia mientras espera respuesta. No use de forma incorrecta este método de contacto o será bloqueado.')

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

    if  (!cmd) return;

    if (!message.guild.me.permissions.has(["SEND_MESSAGES"]) && !message.channel.permissionsFor(message.member).has('SEND_MESSAGES', false)) return;

    const isMod = message.member.roles.cache.has(client.config.modRoleID);

    if (cmd.requirements.modOnly && !isMod && !client.config.botOwnerID.includes(message.author.id))
        return message.reply('Comando solo para moderadores.')
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete() 
            }, 5000))
    
    if (cmd.requirements.userPerms && !message.member.permissions.has(cmd.requirements.userPerms))
        return message.reply(`Necesitas los siguientes permisos: ${cmd.requirements.userPerms}`)
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete() 
            }, 10000))

    if (cmd.requirements.clientPerms && !message.guild.me.permissions.has(cmd.requirements.clientPerms))
        return message.reply(`Necesito los siguientes permissions: ${cmd.requirements.clientPerms}`)
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete() 
            }, 10000))

    cmd.run(client, message, args);
}

    