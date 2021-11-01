module.exports.run = (client, message, args, guild) => {

    if (args[0] && client.commands.has(args[0])) {

        const cmd = client.commands.get(args[0])

        const description = strings[guild.language][`${cmd.info.name}HelpDescription`];
        const usage = strings[guild.language][`${cmd.info.name}HelpUsage`];
    
        const commandEmbed = new client.discordjs.MessageEmbed()
            .setTitle(`Help | Command`)
            .setDescription(strings[guild.language].helpCommandHelp.replace('%NAME%', cmd.info.name).replace('%DESC%', description).replace('%USAGE%', usage).replace('%ALIAS%', cmd.info.alias))
            .setColor(65453)
            .setFooter(`Opus Music Bot v${client.config.version} · ${strings[guild.language].botDevelopedBy}`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
        
        message.channel.send({ embeds: [commandEmbed]})
    
    } else {
        
        let commandsArray = client.commands.map(cmd => cmd.info.name)

        for (const command of commandsArray) {
            if (client.commands.get(command).requirements.devOnly) {
                commandsArray.splice(commandsArray.indexOf(command), 1);
            }
        }

        commandsArray = commandsArray.map(cmd => `\`${cmd}\``);

        const helpEmbed = new client.discordjs.MessageEmbed()
            .setTitle(`Help | Opus Music Bot`)
            .setColor(65453)
            .addField('Commands', commandsArray.join(', '))
            .addField('Command Help', strings[guild.language].helpCommandHelpField.replace('%PREFIX%', client.prefix))
            .addField('Changelog', strings[guild.language].helpChangelogField.replace('%PREFIX%', client.prefix))
            .addField('Invite Link', strings[guild.language].helpInviteField)
            .addField('Support', strings[guild.language].helpSupportField.replace('%BOTID%', client.user.id))
            .setFooter(`Opus Music Bot v${client.config.version} · ${strings[guild.language].botDevelopedBy}`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
        
        message.channel.send({ embeds: [helpEmbed]})
    }
}

module.exports.info = {
    name: "help",
    alias: "h"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}