module.exports.run = async (client, message, args, guild) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id).replace('%PREFIX%', client.prefix));
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply(strings[guild.language].userNotConnectedToSameVoice)
    }

    if (!serverQueue.songs[0]) {
        return message.reply(strings[guild.language].botNoQueuedSongs)
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    if (serverQueue.updating) {
        return message.reply(strings[guild.language].botIsUpdating3);
    }

    if (usersConnected <= 2 || message.member.roles.cache.has(guild.modRoleId)) {

        await clear();

    } else {

        message.channel.send(strings[guild.language].skipMessage.replace('%USERCOUNT%', (Math.ceil(usersConnected*0.5))-1).replace('%TOTALUSERCOUNT%', usersConnected).replace('%PREFIX%', client.prefix));

        let filter = m => m.content.split(' ')[0] == `${client.prefix}clear` && m.author.id !== message.author.id && m.member.voice.channel && m.member.voice.channel == serverQueue.voiceChannel;

        message.channel.awaitMessages({
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
            return message.channel.send(strings[guild.language].clearCancelled);
        });
    }

    async function clear() {

        serverQueue.playing = false;
        serverQueue.loop = false;
        serverQueue.shuffle = false;
        serverQueue.songs = [];
        serverQueue.player.stop(true);

        message.channel.send(strings[guild.language].clearComplete);

        serverQueue.inactivity = setTimeout(() => {

            if (!serverQueue.playing && !serverQueue.songs[0]) {

                client.queue.delete(serverQueue.textChannel.guild.id);
                serverQueue.textChannel.send(strings[guild.language].botInactiveFor3Minutes)
                
                if (serverQueue.connection._state.status != 'destroyed') {
                    serverQueue.connection.destroy();
                }
            }

        }, 180 * 1000);
    }
}

module.exports.info = {
    name: "clear",
    alias: "c"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}