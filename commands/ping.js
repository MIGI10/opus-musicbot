module.exports.run = (client, message, args) => {

    const pingembed = new client.discordjs.MessageEmbed()
            .setColor(65453)
            .setTitle('Ping')
            .setFooter('Opus Music Bot v1.0.0 · Desarrollado por migi28#7731', client.user.displayAvatarURL({dynamic: true, size: 1024}))
            .addField('Latency', `> ${Math.abs((Date.now() - message.createdTimestamp))}ms`)
            .addField('API Latency', `> ${Math.round(client.ws.ping)}ms`)

    message.channel.send({ embeds: [pingembed]});
}

module.exports.help = {
    name: "ping",
    description: "Ver mi latencia de respuesta y la del API de Discord",
    usage: "Utilizar solamente el comando",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
}