module.exports.run = (client, interaction, guild) => {

    if (!client.queue.get(interaction.guildId) || !client.queue.get(interaction.guildId).connection) {
        return interaction.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(interaction.guildId);

    if (interaction.channel !== serverQueue.textChannel) {
        return interaction.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id));
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel !== serverQueue.voiceChannel) {
        return interaction.reply(strings[guild.language].userNotConnectedToSameVoice)
    }

    const songNum = interaction.options.getInteger('song');

    if (!songNum) {
        return interaction.reply(strings[guild.language].userMustSpecifySongToRemove)
    }

    if (serverQueue.songs.length <= 1) {
        return interaction.reply(strings[guild.language].removeNoQueuedSongs)
    }

    if (songNum >= serverQueue.songs.length || songNum == 0) {
        return interaction.reply(strings[guild.language].numDoesNotCorrespondToSong.replace('%SONGNUM%', songNum))
    }

    interaction.reply(`**${serverQueue.songs[songNum].title}** ${strings[guild.language].songRemoved}`)

    serverQueue.songs.splice(songNum, 1);
}

module.exports.data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription(strings['eng'].removeHelpDescription)
    .addIntegerOption(option =>
        option.setName('song')
            .setRequired(true)
            .setDescription('Specify a song number to remove. See queue to view the numbering of loaded songs.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}