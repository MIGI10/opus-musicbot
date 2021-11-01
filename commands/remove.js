module.exports.run = (client, message, args, guild) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id).replace('%PREFIX', client.prefix))
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply(strings[guild.language].userNotConnectedToSameVoice)
    }

    if (!args[0] || isNaN(args[0])) {
        return message.reply(strings[guild.language].userMustSpecifySongToRemove.replace('%PREFIX%', client.prefix))
    }

    const songNum = parseInt(args[0]);

    if (serverQueue.songs.length <= 1) {
        return message.reply(strings[guild.language].removeNoQueuedSongs)
    }

    if (songNum >= serverQueue.songs.length || songNum == 0) {
        return message.reply(strings[guild.language].numDoesNotCorrespondToSong.replace('%PREFIX%', client.prefix))
    }

    serverQueue.songs.splice(songNum, 1);

    message.channel.send(`**${serverQueue.songs[songNum].title}** ${strings[guild.language].songRemoved}`)
}

module.exports.info = {
    name: "remove",
    alias: "rem"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}