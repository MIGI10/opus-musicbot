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

    const songNum = interaction.options.getInteger('song');
    const posNum = interaction.options.getInteger('position');

    if (!songNum || !posNum) {
        return interaction.reply(strings[guild.language].userMustSpecifySongPositionToMove);
    }

    if (serverQueue.songs.length <= 2) {
        return interaction.reply(strings[guild.language].notEnoughSongsToMove)
    }

    if (songNum >= serverQueue.songs.length || songNum == 0) {
        return interaction.reply(strings[guild.language].numDoesNotCorrespondToSong.replace('%SONGNUM%', songNum))
    }

    if (posNum >= serverQueue.songs.length || posNum == 0) {
        return interaction.reply(strings[guild.language].numDoesNotCorrespondToPos.replace('%POSNUM%', posNum))
    }

    var songToMove = serverQueue.songs[songNum];
    serverQueue.songs.splice(songNum, 1);
    serverQueue.songs.splice(posNum, 0, songToMove);

    interaction.reply(strings[guild.language].songMoved.replace('%SONGNAME%', songToMove.title).replace('%OLDPOS%', songNum).replace('%NEWPOS%', posNum).replace('%TOTALSONGCOUNT%', serverQueue.songs.length - 1))
}

module.exports.data = new SlashCommandBuilder()
    .setName('move')
    .setDescription(strings['eng'].moveHelpDescription)
    .addIntegerOption(option =>
        option.setName('song')
            .setRequired(true)
            .setDescription('Specify a song number to move. See queue to view the numbering of loaded songs.')
    )
    .addIntegerOption(option =>
        option.setName('position')
            .setRequired(true)
            .setDescription('Specify the queue position to move the song to. See queue to view available positions.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}