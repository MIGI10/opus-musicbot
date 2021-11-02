const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec').raw;

module.exports.run = async (client, message, args, guild) => {

    voice = client.discordjsvoice

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

    if (message.member.roles.cache.has(guild.modRoleId) || message.author.id == nowPlaying.requesterId) {
        message.react('👌');
        serverQueue.player.stop(true);
        return;
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    if (usersConnected <= 2) {

        message.react('👌');
        serverQueue.player.stop(true);

    } else {

        const msg = await message.channel.send(strings[guild.language].skipMessage.replace('%USERCOUNT%', (Math.ceil(usersConnected*0.5))-1).replace('%TOTALUSERCOUNT%', usersConnected).replace('%PREFIX%', client.prefix));

        let filter = m => m.content.split(' ')[0] == `${client.prefix}skip` && m.author.id !== message.author.id && m.member.voice.channel && m.member.voice.channel == serverQueue.voiceChannel;

        message.channel.awaitMessages({
            filter,
            max: ((Math.ceil(usersConnected*0.5))-1),
            time: 20000,
            errors: ['time']
        })
        .then(async collected => {
            if (collected.size == ((Math.ceil(usersConnected*0.5))-1)) {

                message.react('👌');
                serverQueue.player.stop(true);
            }
        })
        .catch(collected => {
            return msg.edit(strings[guild.language].skipCancelled);
        });
    }
}

module.exports.info = {
    name: "skip",
    alias: "s"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}