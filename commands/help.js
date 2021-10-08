module.exports.run = (client, message, args) => {

    if (args[0] && client.commands.has(args[0])) {

        const cmd = client.commands.get(args[0])
    
        const commandEmbed = new client.discordjs.MessageEmbed()
            .setTitle(`Help | Command`)
            .setDescription(`**Nombre:** ${cmd.help.name}\n\n **Descripción:** ${cmd.help.description}\n\n **Uso:** ${cmd.help.usage}\n\n **Alias:** ${cmd.help.alias}`)
            .setColor(65453)
            .setFooter(`Opus Music Bot v${client.config.version} · Desarrollado por migi28#7731`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
        
        message.channel.send({ embeds: [commandEmbed]})
    
    } else {
        
        const commandsArray = client.commands.map(cmd => cmd.help.name)

        for (const command of commandsArray) {
            if (client.commands.get(command).requirements.devOnly) {
                commandsArray.splice(commandsArray.indexOf(command), 1);
            }
        }

        const helpEmbed = new client.discordjs.MessageEmbed()
            .setTitle(`Help | Opus Music Bot`)
            .setColor(65453)
            .addField('Commands', commandsArray.join(', '))
            .addField('Command Help', `Para ver más información de un comando: \`${client.prefix}help <comando>\``)
            .addField('Invite Link', 'Para invitarme a un servidor: https://bit.ly/opusmusicbot')
            .addField('Support', `Para soporte envíame un mensaje privado [<@${client.user.id}>] detallando tu problema`)
            .setFooter(`Opus Music Bot v${client.config.version} · Desarrollado por migi28#7731`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
        
        message.channel.send({ embeds: [helpEmbed]})
    }
}

module.exports.help = {
    name: "help",
    description: "Mostrar el listado de comandos o la información acerca de cada",
    usage: "Para ver el listado, utilizar solamente el comando. Para ver los detalles de un comando, utilizar el comando seguido del nombre del comando a detallar sin prefijo",
    alias: "h"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}