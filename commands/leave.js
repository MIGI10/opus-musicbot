module.exports.run = (client, interaction, guild) => {
    
    if (!client.queue.get(interaction.guildId) || !client.queue.get(interaction.guildId).connection) {
        return interaction.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(interaction.guildId);

    if (interaction.channel !== serverQueue.textChannel) {
        return interaction.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id));
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel !== serverQueue.voiceChannel) {
        return interaction.reply(strings[guild.language].userNotConnectedToSameVoice);
    }

    interaction.reply(strings[guild.language].botLeftChannel.replace('%VOICECHANNEL%', serverQueue.voiceChannel.id));

    clearTimeout(serverQueue.inactivity);

    serverQueue.playing = false;
    
    if (serverQueue.player) {
        serverQueue.player.stop(true);
    }
    
    serverQueue.connection.destroy();

    client.queue.delete(interaction.guildId);
}

module.exports.data = new SlashCommandBuilder()
    .setName('leave')
    .setDescription(strings['eng'].leaveHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}