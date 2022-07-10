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

    if (!serverQueue.playing) {
        return interaction.reply(strings[guild.language].botAlreadyStopped)
    }

    serverQueue.playing = false;
    serverQueue.player.pause();

    const pauseTimestamp = {
        timeAtPause: Date.now(),
        timeAtUnpause: null,
    }

    serverQueue.songs[0].pauseTimestamps.push(pauseTimestamp);

    interaction.reply(strings[guild.language].botPaused);

    serverQueue.inactivity = setTimeout(() => {

        if (!serverQueue.playing) {
            
            client.queue.delete(serverQueue.textChannel.guild.id);
            interaction.channel.send(strings[guild.language].botInactiveFor3Minutes)
            
            if (serverQueue.connection._state.status != 'destroyed') {
                serverQueue.connection.destroy();
            }
        }

    }, 180 * 1000);
}

module.exports.data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription(strings['eng'].pauseHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}