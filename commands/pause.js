module.exports.run = (client, message, args, guild) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id).replace('%PREFIX%', client.prefix));
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply(strings[guild.language].userNotConnectedToSameVoice);
    }

    if (!serverQueue.playing) {
        return message.reply(strings[guild.language].botAlreadyStopped)
    }

    serverQueue.playing = false;
    serverQueue.player.pause();

    const pauseTimestamp = {
        timeAtPause: Date.now(),
        timeAtUnpause: null,
    }

    serverQueue.songs[0].pauseTimestamps.push(pauseTimestamp);

    message.channel.send(strings[guild.language].botPaused.replace('%PREFIX%', client.prefix));

    serverQueue.inactivity = setTimeout(() => {

        if (!serverQueue.playing) {
            
            client.queue.delete(serverQueue.textChannel.guild.id);
            serverQueue.textChannel.send(strings[guild.language].botInactiveFor3Minutes)
            
            if (serverQueue.connection._state.status != 'destroyed') {
                serverQueue.connection.destroy();
            }
        }

    }, 180 * 1000);
}

module.exports.info = {
    name: "pause",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}