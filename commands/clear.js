module.exports.run = async (client, interaction, guild) => {

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
        return interaction.reply(strings[guild.language].botNoQueuedSongs)
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    if (serverQueue.updating) {
        return interaction.reply(strings[guild.language].botIsUpdating3);
    }

    if (usersConnected <= 2 || interaction.member.roles.cache.has(guild.modRoleId)) {

        await clear();

    } else {

        interaction.reply(strings[guild.language].clearMessage.replace('%USERCOUNT%', (Math.ceil(usersConnected*0.5))-1).replace('%TOTALUSERCOUNT%', usersConnected));

        let filter = m => m.content.split(' ')[0] == `${client.prefix}clear` && m.author.id !== interaction.user.id && m.member.voice.channel && m.member.voice.channel == serverQueue.voiceChannel;

        interaction.channel.awaitMessages({
            filter,
            max: ((Math.ceil(usersConnected*0.5))-1),
            time: 20000,
            errors: ['time']
        })
        .then(async collected => {
            if (collected.size == ((Math.ceil(usersConnected*0.5))-1)) {

                await clear();
            }
        })
        .catch(collected => {
            return interaction.editReply(strings[guild.language].clearCancelled);
        });
    }

    async function clear() {

        serverQueue.playing = false;
        serverQueue.loop = false;
        serverQueue.shuffle = false;
        serverQueue.songs = [];
        serverQueue.player.stop(true);

        interaction.channel.send(strings[guild.language].clearComplete);

        serverQueue.inactivity = setTimeout(() => {

            if (!serverQueue.playing && !serverQueue.songs[0]) {

                client.queue.delete(serverQueue.textChannel.guild.id);
                interaction.channel.send(strings[guild.language].botInactiveFor3Minutes);
                
                if (serverQueue.connection._state.status != 'destroyed') {
                    serverQueue.connection.destroy();
                }
            }

        }, 180 * 1000);
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription(strings['eng'].clearHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}