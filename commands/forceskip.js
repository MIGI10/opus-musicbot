const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec').raw;

module.exports.run = async (client, message, args, guild) => {

    voice = client.discordjsvoice

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id).replace('%PREFIX%', client.prefix));
    }

    if (!message.member.voice.channel || message.member.voice.channel != serverQueue.voiceChannel) {
        return message.reply(strings[guild.language].userNotConnectedToSameVoice)
    }

    if (!serverQueue.playing) {
        return message.reply(strings[guild.language].botPlayerStopped)
    }

    if (serverQueue.updating) {
        return message.reply(strings[guild.language].botIsUpdating2)
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete() 
            }, 5000))
    }

    const nowPlaying = serverQueue.songs[0];

    if (!message.member.roles.cache.has(guild.modRoleId) && message.author.id != nowPlaying.requesterId) {
        return message.reply(strings[guild.language].forceskipNotAllowed.replace('%PREFIX%', client.prefix).replace('%REQUESTER%', nowPlaying.requesterUsertag));
    }

    message.react('👌');
    
    serverQueue.player.stop(true);
}

module.exports.info = {
    name: "forceskip",
    alias: "fs"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}