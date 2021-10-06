const ytdl = require('ytdl-core');

module.exports.run = async (client, message, args) => {

    voice = client.discordjsvoice

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡No estoy actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>, puedes usar \`${client.prefix}transfer\` para cambiar el canal de texto de la sesión`)
    }

    if (!message.member.voice.channel || message.member.voice.channel != serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (!serverQueue.playing) {
        return message.reply('El reproductor está detenido')
    }

    const guildSaved = await client.db.guild.findOne({ 
        id: message.guild.id,
    }).catch(err => console.log(err));

    const nowPlaying = serverQueue.songs[0];

    if (!message.member.roles.cache.has(guildSaved.modRoleId) && message.author.id != nowPlaying.requesterId) {
        return message.reply(`Solo puede usar \`${client.prefix}forceskip\` la persona que ha solicitado la canción que suena actualmente (${nowPlaying.requesterUsertag}) o un moderador.`);
    }

    if (serverQueue.loop) {

        return play(serverQueue.songs[0]);

    } else {
        
        serverQueue.songs.shift();

        if (serverQueue.songs.length >= 1) {

            if (serverQueue.shuffle) {

                const totalSongs = serverQueue.songs.length;
                let randomSong = Math.floor(Math.random() * (totalSongs + 1)) - 1;

                if (randomSong < 0) {
                    randomSong = 0;
                }

                var songToMove = serverQueue.songs[randomSong];
                serverQueue.songs.splice(randomSong, 1);
                serverQueue.songs.splice(0, 0, songToMove);

                return play(serverQueue.songs[0]);

            } else {

                return play(serverQueue.songs[0]);
            }

        } else {
            
            if (serverQueue.playing) {
                client.queue.delete(serverQueue.textChannel.guild.id);
                serverQueue.textChannel.send('No hay más canciones en la cola, canal de voz abandonado')
                return serverQueue.connection.destroy();
            }
        }
    }

    async function play(song) {

        const option = {
            filter: "audioonly",
            highWaterMark: 1 << 25,
        };
        const stream = await ytdl(song.url, option);

        const resource = voice.createAudioResource(stream, {
            metadata: song
        });

        serverQueue.player.play(resource);

        song.timeAtPlay = Date.now();
        song.pauseTimestamps = [];

        serverQueue.textChannel.send(`Reproduciendo **${song.title}** [${song.duration}] || Solicitado por \`${song.requesterUsertag}\``);
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