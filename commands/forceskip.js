const ytdl = require('ytdl-core');

module.exports.run = (client, message, args) => {

    voice = client.discordjsvoice

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡No estoy actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>`)
    }

    if (!message.member.voice.channel || message.member.voice.channel != serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (!serverQueue.playing) {
        return message.reply('El reproductor está detenido')
    }

    const nowPlaying = serverQueue.songs[0];

    if (!message.member.roles.cache.has(client.config.modRoleID) && message.author.id != nowPlaying.requesterId) {
        return message.reply(`Solo puede usar \`${client.prefix}forceskip\` la persona que ha solicitado la canción que suena actualmente (${nowPlaying.requesterUsertag}) o un moderador.`);
    }

    serverQueue.songs.shift();

    if (serverQueue.songs.length >= 1) {

        const song = serverQueue.songs[0];
        client.user.setPresence({
            activities: [{ 
                name: song.title,
                type: 'LISTENING'
            }],
            status: 'online'
        })

        const stream = ytdl(song.url, {
            inlineVolume: true,
            filter: "audioonly",
            opusEncoded: true,
            bitrate: 320,
            quality: "highestaudio",
            liveBuffer: 40000,
            highWaterMark: 1 << 32,
        });

        const resource = voice.createAudioResource(stream, {
            inlineVolume: true,
            metadata: song
        });

        serverQueue.player.play(resource);

        song.timeAtPlay = Date.now();

        serverQueue.textChannel.send(`Reproduciendo **${song.title}** [${song.duration}] || Solicitado por \`${song.requesterUsertag}\``);

    } else {

        client.user.setPresence({
            activities: [{ 
                name: `${client.prefix}help | Reproductor detenido`,
                type: 'LISTENING'
            }],
            status: 'idle'
        })
        
        if (serverQueue.playing) {
            client.queue.delete(queue.textChannel.guild.id);
            serverQueue.textChannel.send('No hay más canciones en la cola, canal de voz abandonado')
            return serverQueue.connection.destroy();
        }
    }
}

module.exports.help = {
    name: "forceskip",
    description: "Saltar la canción que suena sin la aprobación de la mitad de usuarios",
    usage: "Solamente la persona que haya solicitado la canción que suena o un moderador puede utilizar el comando",
    alias: "fs"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}