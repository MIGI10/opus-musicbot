const youtubeSearch = require('youtube-search-api');
const spotifyReq = require('../spotify/req-content');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec').raw;
const fs = require("fs");
const path = require('path');

module.exports.run = async (client, message, args) => {

    const guildInfo = await client.db.guild.findOne({ 
        id: message.guild.id,
    }).catch(err => console.log(err));

    if (!guildInfo) return message.channel.send(`No he sido configurado todavía, un usuario con permisos debe ejecutar \`${client.prefix}config\``)

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
            updating: false,
            shuffle: false,
            loop: false,
            inactivity: null
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
            return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>, puedes usar \`${client.prefix}transfer\` para cambiar el canal de texto de la sesión`)
        }

        if (!serverQueue.playing) {
            if (!serverQueue.songs[0]) {
                if (!args[0]) {
                    return message.reply('¡Debes especificar una canción para iniciar el reproductor!')
                } else {
                    clearTimeout(serverQueue.inactivity);
                    serverQueue.inactivity = null;
                    preQueue(args, message);
                    setTimeout(async function() {
                        await play(serverQueue.songs[0], serverQueue, false);
                    }, 3000);
                    return
                }
            } else {
                    clearTimeout(serverQueue.inactivity);
                    serverQueue.inactivity = null;
                    serverQueue.player.unpause();
                    serverQueue.songs[0].pauseTimestamps[serverQueue.songs[0].pauseTimestamps.length - 1].timeAtUnpause = Date.now();
                    serverQueue.playing = true;

                    message.channel.send('Reproductor reanudado')
            }
        } else {

            if (!args[0]) {
                return message.reply('¡Debes especificar una canción para añadirla a la cola!');
            } else {
                return preQueue(args, message);
            }
        }
    } else {

        if (!args[0]) {
            return message.reply('¡Debes especificar una canción para iniciar el reproductor!')
        }

        const voiceChannel = message.member.voice.channel;
        serverQueue.voiceChannel = voiceChannel;

        const textChannel = message.channel;
        serverQueue.textChannel = textChannel;

        message.channel.send(`Conectando a <#${voiceChannel.id}>, ahora solo responderé comandos ejecutados aquí`);

        const permissions = voiceChannel.permissionsFor(message.guild.me);
        if (!permissions.has("VIEW_CHANNEL") || !permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            client.queue.delete(message.guild.id);
            return message.channel.send('ERROR: Necesito el permiso de `VER CANAL`, `CONECTAR` y `HABLAR` para funcionar correctamente!');
        }

        preQueue(args, message);

        try {
            var connection = voice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guildId,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            serverQueue.connection = connection;

            setTimeout(async function() {

                if (!serverQueue.songs[0]) return;

                await play(serverQueue.songs[0], serverQueue, false);

                serverQueue.player.on("error", async (error) => {

                    const idleFunction = serverQueue.player.listeners(voice.AudioPlayerStatus.Idle)[0];
                    serverQueue.player.removeListener(voice.AudioPlayerStatus.Idle, idleFunction);

                    let errorCode = Math.floor(Math.random()*1000);
                    const errorHeader = `--------- Internal error code: 20-${errorCode} ---------`;
                    console.log(errorHeader);
                    console.error(error);

                    const writeStream = fs.createWriteStream(path.join(
                        __dirname,
                        "..",
                        "logs",
                        `${new Date().toISOString()}.log`
                    ));

                    writeStream.write(`${errorHeader}\n\n${error.stack}\n\n${error.info}\n\n${guildInfo}\n\n${serverQueue}`);

                    writeStream.on('error', (err) => {
                        console.error(err)
                    });

                    writeStream.end();
                    
                    /*
                    fs.appendFileSync(path.join(
                        __dirname,
                        "..",
                        "logs",
                        `${new Date().toISOString()}.log`
                    ), JSON.stringify(errorHeader, null, 2) + "\n\n" + JSON.stringify(error, null, 2) + "\n\n" + JSON.stringify(guildInfo, null, 2) + "\n\n" + JSON.stringify(serverQueue, null, 2));
                    */

                    /*
                        message.channel.send(`ERROR: No se ha podido reproducir la canción debido a un error interno, puedes reportar este error enviándome un mensaje privado y proporcionando el siguiente código de error: \`20-${errorCode}\``);
                        client.queue.delete(serverQueue.textChannel.guild.id);
                        return serverQueue.connection.destroy();
                    */

                    if (error.message.includes('403')) { // Temporal solution to random 403 errors from ytdl-core bug

                        await play(error.resource.metadata, serverQueue, true);

                    } else {

                        message.channel.send(`ERROR: No se ha podido reproducir la canción debido a un error, puedes reportar este error enviándome un mensaje privado y proporcionando el siguiente código de error: \`20-${errorCode}\``);
                        return idleFunction();
                    }
                });
            }, 3000);

        } catch (err) {

            client.queue.delete(message.guild.id);
            let errorCode = Math.floor(Math.random()*1000);
            const errorHeader = `--------- Internal error code: 30-${errorCode} ---------`;
            console.log(errorHeader);
            console.error(err);

            const writeStream = fs.createWriteStream(path.join(
                __dirname,
                "..",
                "logs",
                `${new Date().toISOString()}.log`
            ));

            writeStream.write(`${errorHeader}\n\n${error.stack}\n\n${guildInfo}\n\n${serverQueue}`);

            writeStream.on('error', (err) => {
                console.error(err)
            });

            writeStream.end();

            return message.channel.send(`ERROR: Ha ocurrido un error interno, puedes reportar este error enviándome un mensaje privado y proporcionando el siguiente código de error: \`30-${errorCode}\``);
        }
    }

    async function preQueue(args, message) {

        if (!args[0].startsWith('http:') && !args[0].startsWith('https:') && !args[0].startsWith('www.') && !args[0].startsWith('open.') && !args[0].startsWith('youtube.')) {

            await queue(args.join(' '), message.author.id, message.author.tag);
            if (!serverQueue.songs[0]) return;
            message.channel.send(`**${serverQueue.songs[serverQueue.songs.length - 1].title}** [${serverQueue.songs[serverQueue.songs.length - 1].duration}] ha sido añadido a la cola`);
        
        } else {
            
            if (args[0].startsWith('https://open.spotify.com/') || args[0].startsWith('http://open.spotify.com/')) {

                const songs = await spotifyReq.run(client, message, args);

                if (!songs.type) return;

                let i = 1;

                if (songs.type == 'playlist') {

                    if (songs.total - songs.offset <= 100) {
                        message.channel.send(`${songs.length} canciones han sido cargadas y se están añadiendo a la cola`);
                    } else {
                        message.channel.send(`Esta playlist supera el límite de canciones que se pueden añadir a la vez, solamente se han cargado 100 canciones de ${songs.total} y se están añadiendo a la cola`);  
                    }

                    serverQueue.updating = true;
    
                    for (const song of songs) {
                        if (typeof song === 'string') {
    
                            await queue(song, message.author.id, message.author.tag);
    
                            if (i == (songs.length)) {
                                message.channel.send(`Se han añadido ${i} canciones a la cola con éxito`);
                                serverQueue.updating = false;
                            }
                            i++
                        }
                    }
                } else if (songs.type == 'album') {

                    if (songs.total - songs.offset <= 50) {
                        message.channel.send(`${songs.length} canciones han sido cargadas y se están añadiendo a la cola`);
                    } else {
                        message.channel.send(`Esta playlist supera el límite de canciones que se pueden añadir a la vez, solamente se han cargado 100 canciones de ${songs.total} y se están añadiendo a la cola`);  
                    }
                    
                    serverQueue.updating = true;

                    for (const song of songs) {
                        if (typeof song === 'string') {
    
                            await queue(song, message.author.id, message.author.tag);
    
                            if (i == (songs.length)) {
                                message.channel.send(`Se han añadido ${i} canciones a la cola con éxito`);
                                serverQueue.updating = false;
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

        let i = 0;
        video = videoList.items[0];

        while (videoList.items[i].type !== 'video' || videoList.items[i].isLive) {
            video = videoList.items[i + 1];
            i++;
        }

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
            title: video.title.replaceAll(`||`, `\\||`),
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

    async function play(song, queue, error) {

        queue.playing = true
    
        if (!queue.player) {
    
            const player = voice.createAudioPlayer({
                behaviors: {
                    noSubscriber: voice.NoSubscriberBehavior.Pause,
                },
            });
    
            queue.player = player;
        }

        if (!error) {

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

        queue.player.play(resource);
    
        const dispatcher = queue.connection
            .subscribe(queue.player)
    
        song.timeAtPlay = Date.now();
        song.pauseTimestamps = [];

        if (!error) {
            queue.textChannel.send(`Reproduciendo **${song.title}** [${song.duration}] || Solicitado por \`${song.requesterUsertag}\``);
        }
    
        queue.player.once(voice.AudioPlayerStatus.Idle, () => {

            if (queue.loop) {

                return play(queue.songs[0], queue, false);

            } else {

                queue.songs.shift();

                if (queue.songs.length >= 1) {

                    if (queue.shuffle) {
        
                        const totalSongs = queue.songs.length;
                        let randomSong = Math.floor(Math.random() * (totalSongs + 1)) - 1;

                        if (randomSong < 0) {
                            randomSong = 0;
                        }    
        
                        var songToMove = serverQueue.songs[randomSong];
                        serverQueue.songs.splice(randomSong, 1);
                        serverQueue.songs.splice(0, 0, songToMove);
        
                        return play(queue.songs[0], queue, false);

                    } else {

                        return play(queue.songs[0], queue, false);
                    }
                
                } else {
        
                    if (queue.playing) {

                        queue.playing = false;
                        queue.player.stop();
                        queue.textChannel.send('No hay más canciones en la cola, reproductor detenido')

                        queue.inactivity = setTimeout(() => {

                            if (!queue.playing && !queue.songs[0]) {

                                client.queue.delete(queue.textChannel.guild.id);
                                queue.textChannel.send('He estado inactivo durante más de un minuto, canal de voz abandonado')
                                
                                if (serverQueue.connection._state.status != 'destroyed') {
                                    serverQueue.connection.destroy();
                                }
                            }

                        }, 90 * 1000);
                    }
                }
            }
        });
    }
}

module.exports.help = {
    name: "play",
    description: "Conectar a un canal de voz y reproducir la canción solicitada, añadir una canción a la cola y para reanudar tras usar el comando de pausa",
    usage: "Para conectar y reproducir o añadir una canción a la cola, escribe el nombre o link de YouTube/Spotify de una canción. Para cargar una playlist o album de Spotify pega el link del mismo. Para reanudar tras pausa, escribe solo el comando.\n\nHay disponibles dos argumentos opcionales al cargar una playlist o un album de Spotify, el primero es el número de la canción que desea que sea la primera mientras que el segundo invierte el orden de la playlist al escribir `reverse`:\n\nplay [url] <número primera canción> <reverse>",
    alias: "p"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}