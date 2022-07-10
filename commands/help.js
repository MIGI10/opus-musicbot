module.exports.run = (client, interaction, guild) => {

    const cmdArg = interaction.options.getString('command');
    const cmd = client.commands.get(cmdArg)

    if (cmdArg && cmd) {

        const description = strings[guild.language][`${cmdArg}HelpDescription`];
        const usage = strings[guild.language][`${cmdArg}HelpUsage`];
    
        const commandEmbed = new client.discordjs.MessageEmbed()
            .setTitle(`Command Help | Opus Music Bot`)
            .setDescription(strings[guild.language].helpCommandHelp.replace('%NAME%', cmdArg).replace('%DESC%', description).replace('%USAGE%', usage))
            .setColor(65453)
            .setFooter(`Opus Music Bot v${client.config.version} · ${strings[guild.language].botDevelopedBy}`, client.user.displayAvatarURL({dynamic: true, size: 1024}));
        
        interaction.reply({ embeds: [commandEmbed]});
    
    } else {
        
        let commandsArray = Array.from(client.commands.keys())

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
            .addField('Command Help', strings[guild.language].helpCommandHelpField)
            .addField('Changelog', strings[guild.language].helpChangelogField)
            .addField('Invite Link', strings[guild.language].helpInviteField)
            .addField('Support', strings[guild.language].helpSupportField.replace('%BOTID%', client.user.id))
            .setFooter(`Opus Music Bot v${client.config.version} · ${strings[guild.language].botDevelopedBy}`, client.user.displayAvatarURL({dynamic: true, size: 1024}));
        
        interaction.reply({ embeds: [helpEmbed]});
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('help')
    .setDescription(strings['eng'].helpHelpDescription)
    .addStringOption(option =>
        option.setName('command')
            .setRequired(false)
            .setDescription('Specify a command to show more info about it.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}