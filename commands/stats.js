module.exports.run = async (client, message, args, guild) => {

    const guilds = await client.guilds.fetch();    
    const dbGuilds = await client.db.guild.find();  

    const statsEmbed = new client.discordjs.MessageEmbed()
        .setTitle('Stats')
        .addField('Server Count', `${guilds.size}`)
        .addField('Configured Server Count', `${dbGuilds.length}`)
        .addField('Active Players', `${client.queue.size}`)
        .setColor(65453)

    message.channel.send({ embeds: [statsEmbed]});
}

module.exports.info = {
    name: "stats",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: true
}