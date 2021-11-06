module.exports.run = (client, message, args, guild) => {

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

    if (serverQueue.shuffle) {
        serverQueue.shuffle = false;
        return message.channel.send(strings[guild.language].shuffleDisabled)
    } else {
        serverQueue.shuffle = true;
        return message.channel.send(strings[guild.language].shuffleEnabled)
    }
}

module.exports.info = {
    name: "shuffle",
    alias: "sh"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}