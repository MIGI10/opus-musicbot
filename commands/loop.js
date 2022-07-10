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

    if (!serverQueue.songs[0]) {
        return interaction.reply(strings[guild.language].botPlayerSopped)
    }

    if (serverQueue.loop) {
        serverQueue.loop = false;
        return interaction.reply(strings[guild.language].loopDisabled)
    } else {
        serverQueue.loop = true;
        return interaction.reply(strings[guild.language].loopEnabled.replace('%SONGNAME%', serverQueue.songs[0].title).replace('%SONGDURATION%', serverQueue.songs[0].duration))
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('loop')
    .setDescription(strings['eng'].loopHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}