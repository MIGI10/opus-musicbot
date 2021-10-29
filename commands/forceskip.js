const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec').raw;

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

    if (serverQueue.updating) {
        return message.reply('La cola está siendo actualizada, espere unos segundos a que finalice')
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete() 
            }, 5000))
    }

    const guildSaved = await client.db.guild.findOne({ 
        id: message.guild.id,
    }).catch(err => console.log(err));

    const nowPlaying = serverQueue.songs[0];

    if (!message.member.roles.cache.has(guildSaved.modRoleId) && message.author.id != nowPlaying.requesterId) {
        return message.reply(`Solo puede usar \`${client.prefix}forceskip\` la persona que ha solicitado la canción que suena actualmente (${nowPlaying.requesterUsertag}) o un moderador.`);
    }

    serverQueue.playingEmbed.delete();

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

                serverQueue.playing = false;
                serverQueue.player.stop();
                serverQueue.textChannel.send('No hay más canciones en la cola, reproductor detenido')

                serverQueue.inactivity = setTimeout(() => {

                    if (!serverQueue.playing && !serverQueue.songs[0]) {

                        client.queue.delete(serverQueue.textChannel.guild.id);
                        serverQueue.textChannel.send('He estado inactivo durante más de un minuto, canal de voz abandonado')
                        
                        if (serverQueue.connection._state.status != 'destroyed') {
                            serverQueue.connection.destroy();
                        }
                    }

                }, 90 * 1000);
            }
        }
    }

    async function play(song) {

        if (song.durationSeconds < 600) { // Temporary solution to player aborted ytdl-core bug for long videos
            
            const option = {
                filter: "audioonly",
                highWaterMark: 1 << 25,
            };
            const stream = await ytdl(song.url, option);
    
            var resource = voice.createAudioResource(stream, {
                metadata: song
            });

        } else {

            const stream = youtubedl(song.url, {
                o: '-',
                q: '',
                f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                r: '100K',
              }, { stdio: ['ignore', 'pipe', 'ignore'] });
        
            var resource = voice.createAudioResource(stream.stdout, {
                metadata: song
            });
        }

        serverQueue.player.play(resource);

        song.timeAtPlay = Date.now();
        song.pauseTimestamps = [];

        const nowPlayingEmbed = new client.discordjs.MessageEmbed()
        .setAuthor(`Ahora Suena`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
        .setTitle(`${song.title} [${song.duration}]`)
        .setFooter(`Solicitado por ${song.requesterUsertag}`)
        .setURL(song.url)
        .setColor(65453)

        const nowPlayingMsg = await serverQueue.textChannel.send({ embeds: [nowPlayingEmbed]});

        serverQueue.playingEmbed = nowPlayingMsg;
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
    modOnly: false,
    devOnly: false
}