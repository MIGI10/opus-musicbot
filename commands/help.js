module.exports.run = (client, message, args) => {

    if (args[0] && client.commands.has(args[0])) {

        const cmd = client.commands.get(args[0])
    
        const commandEmbed = new client.discordjs.MessageEmbed()
            .setTitle(`Help | Command`)
            .setDescription(`**Nombre:** ${cmd.help.name}\n\n **Descripción:** ${cmd.help.description}\n\n **Uso:** ${cmd.help.usage}\n\n **Alias:** ${cmd.help.alias}`)
            .setColor('#00f5ff')
            .setFooter('Opus Music Bot v1.0.0 · Desarrollado por migi28#7731', client.user.displayAvatarURL({dynamic: true, size: 1024}))
        
        message.channel.send({ embeds: [commandEmbed]})
    
    } else {
        
        const commandsArray = client.commands.map(cmd => cmd.help.name)

        commandsArray.splice(commandsArray.indexOf('eval'), 1)

        const helpEmbed = new client.discordjs.MessageEmbed()
            .setTitle(`Help | Command List`)
            .setDescription(commandsArray.join(', ') + `\n\nPara ver más información de un comando: \`${client.prefix}help\` *comando*`)
            .setColor('#00f5ff')
            .setFooter('Opus Music Bot v1.0.0 · Desarrollado por migi28#7731', client.user.displayAvatarURL({dynamic: true, size: 1024}))
        
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
    modOnly: false
}