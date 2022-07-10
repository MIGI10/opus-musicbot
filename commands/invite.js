module.exports.run = async (client, interaction, guild) => {
    
    const inviteEmbed = new client.discordjs.MessageEmbed()
        .setTitle(`Invite | Opus Music Bot`)
        .setDescription(strings[guild.language].botInviteLink)
        .setColor(65453)
        .setFooter(`Opus Music Bot v${client.config.version} · ${strings[guild.language].botDevelopedBy}`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
    
    interaction.reply({ embeds: [inviteEmbed]})
}

module.exports.data = new SlashCommandBuilder()
    .setName('invite')
    .setDescription(strings['eng'].inviteHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}