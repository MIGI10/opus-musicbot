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

    if (!args[0] || !args[1] || isNaN(args[0]) || isNaN(args[1])) {
        return message.reply(strings[guild.language].userMustSpecifySongPositionToMove.replace('%PREFIX%', client.prefix));
    }

    const songNum = parseInt(args[0]);
    const posNum = parseInt(args[1]);

    if (serverQueue.songs.length <= 2) {
        return message.reply(strings[guild.language].notEnoughSongsToMove)
    }

    if (songNum >= serverQueue.songs.length || songNum == 0) {
        return message.reply(strings[guild.language].numDoesNotCorrespondToSong.replace('%SONGNUM%', songNum).replace('%PREFIX%', client.prefix))
    }

    if (posNum >= serverQueue.songs.length || posNum == 0) {
        return message.reply(strings[guild.language].numDoesNotCorrespondToPos.replace('%POSNUM%', posNum).replace('%PREFIX%', client.prefix))
    }

    var songToMove = serverQueue.songs[songNum];
    serverQueue.songs.splice(songNum, 1);
    serverQueue.songs.splice(posNum, 0, songToMove);

    message.channel.send(strings[guild.language].songMoved.replace('%SONGNAME%', songToMove.title).replace('%OLDPOS%', songNum).replace('%NEWPOS%', posNum).replace('%TOTALSONGCOUNT%', serverQueue.songs.length - 1))
}

module.exports.info = {
    name: "move",
    alias: "m"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}