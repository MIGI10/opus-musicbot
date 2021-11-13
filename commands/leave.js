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

    serverQueue.textChannel.send(strings[guild.language].botLeftChannel.replace('%VOICECHANNEL%', serverQueue.voiceChannel.id));

    clearTimeout(serverQueue.inactivity);

    serverQueue.playing = false;
    serverQueue.player.stop();
    
    serverQueue.connection.destroy();

    client.queue.delete(message.guild.id);
}

module.exports.info = {
    name: "leave",
    alias: "l"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}