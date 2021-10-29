module.exports.run = async (client, message, args) => {
    
    const inviteEmbed = new client.discordjs.MessageEmbed()
        .setTitle(`Invite | Opus Music Bot`)
        .setDescription('[**¡Puedes invitar a tu bot de música de confianza a un servidor tuyo con este enlace!**]( https://bit.ly/opusmusicbot)')
        .setColor(65453)
        .setFooter(`Opus Music Bot v${client.config.version} · Desarrollado por migi28#7731`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
    
    message.channel.send({ embeds: [inviteEmbed]})
}

module.exports.help = {
    name: "invite",
    description: "Muestra el link de invitación del bot",
    usage: "Únicamente debe ejecutarse el comando",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}