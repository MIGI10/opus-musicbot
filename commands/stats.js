module.exports.run = async (client, interaction, guild) => {

    const dbGuilds = await client.db.guild.find();  

    const statsEmbed = new client.discordjs.MessageEmbed()
        .setTitle('Stats')
        .addField('Server Count', `${client.guilds.cache.size}`)
        .addField('Configured Server Count', `${dbGuilds.length}`)
        .addField('Active Players', `${client.queue.size}`)
        .setColor(65453)

    interaction.reply({ embeds: [statsEmbed]});
}

module.exports.data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show bot stats.')

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: true
}