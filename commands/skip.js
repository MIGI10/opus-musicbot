module.exports.run = async (client, interaction, guild) => {

    voice = client.discordjsvoice

    if (!client.queue.get(interaction.guild.id) || !client.queue.get(interaction.guild.id).connection) {
        return interaction.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(interaction.guildId);

    if (interaction.channel !== serverQueue.textChannel) {
        return interaction.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id));
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel !== serverQueue.voiceChannel) {
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

    if (interaction.member.roles.cache.has(guild.modRoleId) || interaction.user.id == nowPlaying.requesterId) {

        interaction.reply(strings[guild.language].skippedSong);

        serverQueue.player.stop(true);
        return;
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    if (usersConnected <= 2) {

        interaction.reply(strings[guild.language].skippedSong);
        serverQueue.player.stop(true);

    } else {

        interaction.reply(strings[guild.language].skipMessage.replace('%USERCOUNT%', (Math.ceil(usersConnected*0.5))-1).replace('%TOTALUSERCOUNT%', usersConnected));

        let filter = m => m.content.split(' ')[0] == `${client.prefix}skip` && m.author.id !== interaction.user.id && m.member.voice.channel && m.member.voice.channel == serverQueue.voiceChannel;

        interaction.channel.awaitMessages({
            filter,
            max: ((Math.ceil(usersConnected*0.5))-1),
            time: 20000,
            errors: ['time']
        })
        .then(async collected => {
            if (collected.size == ((Math.ceil(usersConnected*0.5))-1)) {

                interaction.editReply(strings[guild.language].skippedSong);
                serverQueue.player.stop(true);
            }
        })
        .catch(collected => {
            return interaction.editReply(strings[guild.language].skipCancelled);
        });
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription(strings['eng'].skipHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}