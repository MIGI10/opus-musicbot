const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec').raw;

module.exports.run = async (client, message, args) => {

    voice = client.discordjsvoice

    const guildSaved = await client.db.guild.findOne({ 
        id: message.guild.id,
    }).catch(err => console.log(err));

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡El bot no está actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>, puedes usar \`${client.prefix}transfer\` para cambiar el canal de texto de la sesión`)
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
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

    const nowPlaying = serverQueue.songs[0];

    if (message.member.roles.cache.has(guildSaved.modRoleId) || message.author.id == nowPlaying.requesterId) {
        return skip();
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    if (usersConnected <= 2) {

        await skip();

    } else {

        const msg = await message.channel.send(`Para saltar la canción actual, **${(Math.ceil(usersConnected*0.5))-1}** persona(s) más de las ${usersConnected} conectadas deben enviar \`${client.prefix}skip\` en menos de 20 segundos.`);

        let filter = m => m.content.split(' ')[0] == `${client.prefix}skip` && m.author.id !== message.author.id && m.member.voice.channel && m.member.voice.channel == serverQueue.voiceChannel;

        message.channel.awaitMessages({
            filter,
            max: ((Math.ceil(usersConnected*0.5))-1),
            time: 20000,
            errors: ['time']
        })
        .then(async collected => {
            if (collected.size == ((Math.ceil(usersConnected*0.5))-1)) {

                await skip();   
            }
        })
        .catch(collected => {
            return msg.edit(`Skip cancelado.`);
        });
    }

    async function skip() {

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
    name: "skip",
    description: "Saltar la canción que suena, al menos la mitad de los usuarios conectados deben estar de acuerdo, si el usuario que solicita el skip es moderador o es el que ha solicitado la canción, no hace falta el acuerdo de los otros usuarios",
    usage: "La mitad de las personas conectadas al canal de voz deben utilizar el comando en menos de 20 segundos a partir del primer `skip`",
    alias: "s"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}