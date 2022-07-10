module.exports.run = async (client, interaction, guild) => {

    voice = client.discordjsvoice

    if (!client.queue.get(interaction.guildId) || !client.queue.get(interaction.guildId).connection) {
        return interaction.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(interaction.guildId);

    if (interaction.channel !== serverQueue.textChannel) {
        return interaction.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id));
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel != serverQueue.voiceChannel) {
        return interaction.reply(strings[guild.language].userNotConnectedToSameVoice)
    }

    if (!serverQueue.playing) {
        return interaction.reply(strings[guild.language].botPlayerStopped)
    }

    if (serverQueue.updating) {
        return interaction.reply(strings[guild.language].botIsUpdating2)
            .then(setTimeout(() => { 
                interaction.deleteReply()
                .catch((err) => null);
            }, 5000))
    }

    const nowPlaying = serverQueue.songs[0];

    if (!interaction.member.roles.cache.has(guild.modRoleId) && interaction.user.id != nowPlaying.requesterId) {
        return interaction.reply(strings[guild.language].forceskipNotAllowed.replace('%REQUESTER%', nowPlaying.requesterUsertag));
    }

    interaction.reply(strings[guild.language].skippedSong);
    
    serverQueue.player.stop(true);
}

module.exports.data = new SlashCommandBuilder()
    .setName('forceskip')
    .setDescription(strings['eng'].forceskipHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}