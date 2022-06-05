module.exports.run = (client, message, args, guild) => {

    const pingembed = new client.discordjs.MessageEmbed()
            .setColor(65453)
            .setTitle('Ping | Opus Music Bot')
            .setFooter({ text: `Opus Music Bot v${client.config.version} · ${strings[guild.language].botDevelopedBy}`, iconURL: client.user.displayAvatarURL({dynamic: true, size: 1024})})
            .addField(strings[guild.language].botLatency, `> ${Math.abs((Date.now() - message.createdTimestamp))}ms`)
            .addField(`API ${strings[guild.language].botLatency}`, `> ${Math.round(client.ws.ping)}ms`)

    message.channel.send({ embeds: [pingembed]});
}

module.exports.info = {
    name: "ping",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}