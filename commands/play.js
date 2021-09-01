const youtubeSearch = require('youtube-search-api');
const youtubedl = require('youtube-dl-exec').raw;
const spotifyReq = require('../spotify/req-content');

module.exports.run = async (client, message, args) => {

    const guildConfigured = await client.db.guild.findOne({ 
        id: message.guild.id,
    }).catch(err => console.log(err));

    if (!guildConfigured) return message.channel.send(`No he sido configurado todavía, un usuario con permisos debe ejecutar \`${client.prefix}config\``)

    voice = client.discordjsvoice

    if (!client.queue.get(message.guild.id)) { 
        client.queue.set(message.guild.id, {
            textChannel: null,
            voiceChannel: null,
            connection: null,
            player: null,
            songs: [],
            volume: 5,
            playing: false,
        })
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (!message.member.voice.channel && !serverQueue.voiceChannel) {
        return message.reply('¡Tienes que estar conectado a un canal de voz!')
    }

    if (serverQueue.voiceChannel) {

        if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
            return message.reply('¡No estás conectado al mismo canal de voz que yo!')
        }

        if (message.channel !== serverQueue.textChannel) {
            return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>`)
        }

        if (!serverQueue.playing) {
            if (!serverQueue.songs[0]) {
                if (!args[0]) {
                    return message.reply('¡Debes especificar una canción para iniciar el reproductor!')
                } else {
                    preQueue(args, message);
                    setTimeout(function() {
                        play(serverQueue.songs[0], serverQueue, client);
                    }, 3000);
                    return
                }
            } else {
                    serverQueue.player.unpause();
                    serverQueue.songs[0].pauseTimestamps[serverQueue.songs[0].pauseTimestamps.length - 1].timeAtUnpause = Date.now();
                    serverQueue.playing = true;

                    message.channel.send('Reproductor reanudado')
            }
        } else {
            return preQueue(args, message);
        }
    } else {

        if (!args[0]) {
            return message.reply('¡Debes especificar una canción para iniciar el reproductor!')
        }

        const voiceChannel = message.member.voice.channel;
        serverQueue.voiceChannel = voiceChannel;

        const textChannel = message.channel;
        serverQueue.textChannel = textChannel;

        preQueue(args, message);
        message.channel.send(`Conectando a <#${voiceChannel.id}>, ahora solo responderé comandos ejecutados aquí`);

        const permissions = voiceChannel.permissionsFor(message.guild.me);
        if (!permissions.has("VIEW_CHANNEL") || !permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            client.queue.delete(message.guild.id);
            return message.channel.send('ERROR: Necesito el permiso de `VER CANAL`, `CONECTAR` y `HABLAR` para funcionar correctamente!');
        }

        try {
            var connection = voice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guildId,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            serverQueue.connection = connection;

            setTimeout(function() {
                play(serverQueue.songs[0], serverQueue, client);
            }, 3000);
        } catch (err) {
                client.queue.delete(message.guild.id);
                let errorCode = Math.floor(Math.random()*1000);
                console.log(`--------- Internal error code: ${errorCode} ---------`);
                console.log(err);
                return message.channel.send(`ERROR: Ha ocurrido un error interno, si el problema persiste contacta con la administración del servidor y proporciona el siguiente código de error: \`${errorCode}\``);
            }
    }

    async function preQueue(args, message) {

        if (!args[0].startsWith('http:') && !args[0].startsWith('https:') && !args[0].startsWith('www.') && !args[0].startsWith('open.') && !args[0].startsWith('youtube.')) {

            await queue(args.join(' '), message.author.id, message.author.tag);
            message.channel.send(`**${serverQueue.songs[serverQueue.songs.length - 1].title}** [${serverQueue.songs[serverQueue.songs.length - 1].duration}] ha sido añadido a la cola`);
        
        } else {
            
            if (args[0].startsWith('https://open.spotify.com/') || args[0].startsWith('http://open.spotify.com/')) {

                const songs = await spotifyReq.run(client, message, args);

                let i = 1;

                if (songs.type == 'playlist') {

                    if (songs.total <= 100) {
                        message.channel.send(`${songs.length} canciones han sido cargadas y se están añadiendo a la cola`);
                    } else {
                        message.channel.send(`Esta playlist supera el límite de canciones que se pueden añadir a la vez, solamente se han cargado 100 canciones de ${songs.total} y se están añadiendo a la cola`);  
                    }
    
                    for (const song of songs) {
                        if (typeof song === 'string') {
    
                            await queue(song, message.author.id, message.author.tag);
    
                            if (i == (songs.length)) {
                                message.channel.send(`Se han añadido ${i} canciones a la cola con éxito`);
                            }
                            i++
                        }
                    }
                } else if (songs.type == 'album') {

                    if (songs.total <= 50) {
                        message.channel.send(`${songs.length} canciones han sido cargadas y se están añadiendo a la cola`);
                    } else {
                        message.channel.send(`Este album supera el límite de canciones que se pueden añadir a la vez, solamente se han cargado 50 canciones de ${songs.total} y se están añadiendo a la cola`);  
                    }
    
                    for (const song of songs) {
                        if (typeof song === 'string') {
    
                            await queue(song, message.author.id, message.author.tag);
    
                            if (i == (songs.length)) {
                                message.channel.send(`Se han añadido ${i} canciones a la cola con éxito`);
                            }
                            i++
                        }
                    }
                } else if (songs.type == 'track') {

                    await queue(songs[0], message.author.id, message.author.tag);
                    message.channel.send(`**${serverQueue.songs[serverQueue.songs.length - 1].title}** [${serverQueue.songs[serverQueue.songs.length - 1].duration}] ha sido añadido a la cola`);
                }
            }

            if (args[0].startsWith('https://youtube.com') || args[0].startsWith('https://www.youtube.com')) {

                const urlArray = args[0].split('/');
                const urlType = urlArray[3].split('?')[0];

                if (urlType == 'watch') {
                    const videoId = urlArray[3].split('=')[1];
                    await queue(videoId, message.author.id, message.author.tag);
                } else {
                    return message.channel.send('¡Las playlists de YouTube todavía no son compatibles!')
                }              
            }
        }
    }

    async function queue(songName, requesterId, requesterUsertag) {

        const videoList = await youtubeSearch.GetListByKeyword(songName, false);
        const video = videoList.items[0];

        if (video.type !== 'video') return

        const length = video.length.simpleText;
        let durationArray = length.split(':');
        durationArray = durationArray.map(Number);

        let totalDurationSeconds = 0;

        if (durationArray.length == 3) {

            let durationHours = durationArray[0];
            let durationMins = durationArray[1];
            let durationSeconds = durationArray[2];

            const hoursToSeconds = durationHours * 3600;
            totalDurationSeconds += hoursToSeconds;

            const minutesToSeconds = durationMins * 60;
            totalDurationSeconds += minutesToSeconds;

            totalDurationSeconds += durationSeconds;

            if (durationHours.toString().length == '1') {
                durationHours = '0' + durationHours
            }
            if (durationMins.toString().length == '1') {
                durationMins = '0' + durationMins
            }  
            if (durationSeconds.toString().length == '1') {
                durationSeconds = '0' + durationSeconds
            }

            duration = durationHours + ':' + durationMins + ':' + durationSeconds;

        } else {

            let durationMins = durationArray[0];
            let durationSeconds = durationArray[1];

            const minutesToSeconds = durationMins * 60;
            totalDurationSeconds += minutesToSeconds;

            totalDurationSeconds += durationSeconds;

            if (durationMins.toString().length == '1') {
                durationMins = '0' + durationMins
            }  
            if (durationSeconds.toString().length == '1') {
                durationSeconds = '0' + durationSeconds
            }

            duration = durationMins + ':' + durationSeconds;
        }

        const song = {
            title: video.title,
            duration: duration,
            durationSeconds: totalDurationSeconds,
            timeAtPlay: null,
            pauseTimestamps: [],
            url: 'https://www.youtube.com/watch?v=' + video.id,
            requesterId: requesterId,
            requesterUsertag: requesterUsertag
        };

        return serverQueue.songs.push(song);
    }

    async function play(song, queue, client) {

        queue.playing = true
    
        if (!queue.player) {
    
            const player = voice.createAudioPlayer({
                behaviors: {
                    noSubscriber: voice.NoSubscriberBehavior.Pause,
                },
            });
    
            queue.player = player;
        }
    
        const stream = youtubedl(song.url, {
            o: '-',
            q: '',
            f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
            r: '100K',
          }, { stdio: ['ignore', 'pipe', 'ignore'] });
    
        const resource = voice.createAudioResource(stream.stdout);
    
        queue.player.play(resource);
    
        const dispatcher = queue.connection
            .subscribe(queue.player)
    
        song.timeAtPlay = Date.now();
    
        queue.player.once(voice.AudioPlayerStatus.Idle, () => {
    
            queue.songs.shift();
            if (queue.songs.length >= 1) {
                return play(queue.songs[0], queue, client);
            } else {
    
                if (queue.playing) {
                    client.queue.delete(queue.textChannel.guild.id);
                    queue.textChannel.send('No hay más canciones en la cola, canal de voz abandonado')
                    return queue.connection.destroy();
                }
            }
        });
    
        queue.player.once("error", (error) => {
            let errorCode = Math.floor(Math.random()*1000);
            console.log(`--------- Internal error code: ${errorCode} ---------`);
            console.error(error);
            message.channel.send(`ERROR: Ha ocurrido un error interno, si el problema persiste contacta con la administración del servidor y proporciona el siguiente código de error: \`${errorCode}\``);
    
            client.queue.delete(queue.textChannel.guild.id);
            return queue.connection.destroy();
        });
    
        queue.textChannel.send(`Reproduciendo **${song.title}** [${song.duration}] || Solicitado por \`${song.requesterUsertag}\``);
    }
}

module.exports.help = {
    name: "play",
    description: "Conectar a un canal de voz y reproducir la canción solicitada, añadir una canción a la cola y para reanudar tras usar el comando de pausa",
    usage: "Para conectar y reproducir o añadir una canción a la cola, escribir el nombre de la canción y artista seguido del comando. Para reanudar tras pausa, escribir solo el comando",
    alias: "p"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}