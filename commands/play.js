const youtubeSearch = require('youtube-search-api');
const spotifyReq = require('../spotify/reqContent');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec').raw;

module.exports.run = async (client, interaction, guild) => {

    voice = client.discordjsvoice

    if (!client.queue.get(interaction.guildId)) { 
        client.queue.set(interaction.guildId, {
            textChannel: null,
            voiceChannel: null,
            connection: null,
            player: null,
            songs: [],
            playing: false,
            updating: false,
            shuffle: false,
            loop: false,
            inactivity: null,
            playingEmbed: null
        })
    }

    const serverQueue = client.queue.get(interaction.guildId);

    if (!interaction.member.voice.channel && !serverQueue.voiceChannel) {
        client.queue.delete(interaction.guildId);
        return interaction.reply(strings[guild.language].userNotConnectedToVoice);
    }

    const queryArg = interaction.options.getString('query');
    const linkArg = interaction.options.getString('link');

    if (queryArg) {
        args = queryArg;
        argsType = 'query';
    }
    else if (linkArg) {
        args = linkArg;
        argsType = 'link';
    }
    else {
        args = null;
        argsType = null;
    }

    if (serverQueue.voiceChannel) {

        if (!interaction.member.voice.channel || interaction.member.voice.channel !== serverQueue.voiceChannel) {
            return interaction.reply(strings[guild.language].userNotConnectedToSameVoice)
        }

        if (interaction.channel !== serverQueue.textChannel) {
            return interaction.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id));
        }

        if (!serverQueue.playing) {

            if (!serverQueue.songs[0]) {

                if (!args) {

                    return interaction.reply(strings[guild.language].userMustSpecifySongToStartPlayer)
                } 
                else {

                    clearTimeout(serverQueue.inactivity);
                    serverQueue.inactivity = null;

                    await preQueue(interaction, args, argsType)
                        .catch(err => {
                            let errorCode = logError(err, '10', interaction, guild, serverQueue);
                            return interaction.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                        });
                    await play(serverQueue.songs[0], serverQueue, false)
                        .catch(err => {
                            logError(err, '30', interaction, guild, serverQueue);
                        });

                    return;
                }
            } else {
                    clearTimeout(serverQueue.inactivity);
                    serverQueue.inactivity = null;
                    serverQueue.player.unpause();
                    serverQueue.songs[0].pauseTimestamps[serverQueue.songs[0].pauseTimestamps.length - 1].timeAtUnpause = Date.now();
                    serverQueue.playing = true;

                    interaction.reply(strings[guild.language].botPlayerResumed)
            }
        } else {

            if (!args) {
                return interaction.reply(strings[guild.language].userMustSpecifySongToQueue);
            } else {
                return preQueue(interaction, args, argsType)
                    .catch(err => {
                        let errorCode = logError(err, '10', interaction, guild, serverQueue);
                        return interaction.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                    });
            }
        }
    } else {

        if (!args) {
            client.queue.delete(interaction.guildId);
            return interaction.reply(strings[guild.language].userMustSpecifySongToStartPlayer)
        }

        const voiceChannel = interaction.member.voice.channel;
        serverQueue.voiceChannel = voiceChannel;

        const textChannel = interaction.channel;
        serverQueue.textChannel = textChannel;

        interaction.reply(strings[guild.language].botConnectingToVoice.replace('%VOICECHANNELID%', voiceChannel.id));

        const permissions = voiceChannel.permissionsFor(interaction.guild.me);
        if (!permissions.has("VIEW_CHANNEL") || !permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            client.queue.delete(interaction.guildId);
            return interaction.channel.send(strings[guild.language].botNeedsPermsToConnect);
        }

        await preQueue(interaction, args, argsType)
            .catch(err => {
                let errorCode = logError(err, '10', interaction, guild, serverQueue);
                return interaction.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
            });

        try {
            var connection = voice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            serverQueue.connection = connection;

        } catch (err) {

            client.queue.delete(interaction.guildId);

            let errorCode = logError(err, '20', interaction, guild, serverQueue);

            return interaction.channel.send(strings[guild.language].botCouldNotConnect).replace('%ERRORCODE%', errorCode);
        }

        await play(serverQueue.songs[0], serverQueue, false)
            .catch(err => {
                logError(err, '30', interaction, guild, serverQueue);
            });

        serverQueue.player.on("error", async (error) => {

            const idleFunction = serverQueue.player.listeners(voice.AudioPlayerStatus.Idle)[0];
            serverQueue.player.removeListener(voice.AudioPlayerStatus.Idle, idleFunction);

            let errorCode = await logError(error, '40', null, guild, serverQueue);

            if (error.message.includes('403')) { // Temporary solution to random 403 errors from ytdl-core bug

                await play(error.resource.metadata, serverQueue, true)
                    .catch(err => {
                        logError(err, '30', null, guild, serverQueue);
                    });
            } 
            else if (error.message.includes('410')) { // Temporary inform message about restricted or sensitive videos

                serverQueue.textChannel.send(strings[guild.language].botCouldNotPlayFlaggedSong.replace('%ERRORCODE%', errorCode));
                return idleFunction();
            }
            else if (error.message.includes('socket')) { // Temporary response to "Client network socket disconnected before secure TLS connection was established"

                serverQueue.textChannel.send(strings[guild.language].botSocketError.replace('%ERRORCODE%', errorCode));

                serverQueue.playing = false;
                
                if (serverQueue.player) {
                    serverQueue.player.stop(true);
                }

                if (serverQueue.connection._state.status != 'destroyed') {
                    serverQueue.connection.destroy();
                }

                client.queue.delete(interaction.guildId);

                return;
            }
            else {

                serverQueue.textChannel.send(strings[guild.language].botCouldNotPlaySong.replace('%ERRORCODE%', errorCode));
                return idleFunction();
            }
        });
    }

    async function preQueue(interaction, args, argsType) {

        if (serverQueue.updating) {

            if (!interaction.replied) {
                return interaction.reply(strings[guild.language].botIsUpdating2);
            }
            else {
                return interaction.channel.send(strings[guild.language].botIsUpdating2);
            }
        }

        if (argsType == 'query') {
            
            const queueSong = await queue(args, interaction.user.id, interaction.user.tag)
                .catch(err => {
                    let errorCode = logError(err, '11', interaction, guild, serverQueue);
                    return interaction.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                });

            if (!serverQueue.songs[0] || !queueSong) return;

            const newSong = serverQueue.songs[serverQueue.songs.length - 1];

            const queuedEmbed = new client.discordjs.MessageEmbed()
                .setDescription(`[**${newSong.title} [${newSong.duration}]**](${newSong.url}) ${strings[guild.language].songQueued.replace('%POSNUM%', serverQueue.songs.length - 1)}`)
                .setColor(65453);
            
            if (!interaction.replied) {
                interaction.reply({ embeds: [queuedEmbed]});
            }
            else {
                interaction.channel.send({ embeds: [queuedEmbed]});
            }
        } 
        else {
            
            if (args.includes('open.spotify.com/')) {

                const songs = await spotifyReq(client, interaction, args, guild)
                    .catch(err => {
                        let errorCode = logError(err, '15', interaction, guild, serverQueue);
                        return interaction.channel.send(strings[guild.language].botCouldNotQueueSpotify.replace('%ERRORCODE%', errorCode));
                    });

                if (!songs.type) return;

                let i = 1;

                if (songs.type == 'playlist' || songs.type == 'album' || songs.type == 'artist') {

                    let queuedEmbed = new client.discordjs.MessageEmbed()
                        .setAuthor({ name: strings[guild.language].songsBeingQueued, iconURL: 'https://i.gifer.com/origin/6a/6af36f7b9c1ac8a7e9d7dbcaa479b616.gif'})
                        .setColor(65453)
                        .setDescription('\n\n' + strings[guild.language].songsLoading.replace('%SONGCOUNT%', songs.length))

                    if (!interaction.replied) {
                        interaction.reply({ embeds: [queuedEmbed]});
                        queuedMsg = null;
                    }
                    else {
                        queuedMsg = await interaction.channel.send({ embeds: [queuedEmbed]});
                    }

                    serverQueue.updating = true;
    
                    for (const song of songs) {

                        if (typeof song === 'string') {
                            
                            if (i == 1) {
                                await queue(song, interaction.user.id, interaction.user.tag, i)
                                    .catch(err => {
                                        logError(err, '12', interaction, guild, serverQueue);
                                });
                            } else {
                                queue(song, interaction.user.id, interaction.user.tag, i)
                                    .catch(err => {
                                        logError(err, '12', interaction, guild, serverQueue);
                                    });
                            }
    
                            if (i == songs.length) {

                                if (songs.length <= 100) {
                                    waitTime = 7000;
                                }
                                else if (songs.length <= 200) {
                                    waitTime = 10000;
                                }
                                else {
                                    waitTime = (songs.length / 20) * 1000;
                                }

                                setTimeout(async () => {

                                    const sorted = serverQueue.songs.filter(song => song.position).sort((a, b) => {
                                        return a.position - b.position;
                                    })
                                    
                                    let firstSong = serverQueue.songs.indexOf(serverQueue.songs.find(element => element.position)) + 1;
                                    let lastSong = serverQueue.songs.indexOf(serverQueue.songs.filter(element => element.position).pop()) + 1;

                                    for await (const sortedSong of sorted) {
                                        sortedSong.position = null;
                                    }

                                    serverQueue.songs.splice(firstSong, lastSong - firstSong);

                                    for (let i = firstSong, j = 1; i < lastSong; i++, j++) {
                                        serverQueue.songs.splice(i, 0, sorted[j]);
                                    }

                                    serverQueue.updating = false;

                                    queuedEmbed = new client.discordjs.MessageEmbed()
                                        .setDescription(strings[guild.language].songsQueued.replace('%SONGCOUNT%', i - 1).replace('%CONTENTNAME%', songs.contentName))
                                        .setAuthor({ name: songs.contentName, iconURL: songs.contentIcon})
                                        .setColor(65453);

                                    if (!queuedMsg) {
                                        interaction.editReply({ embeds: [queuedEmbed]});
                                    }
                                    else {
                                        queuedMsg.edit({ embeds: [queuedEmbed]});
                                    }

                                }, waitTime);
                            }

                            i++
                        }
                    }

                } else if (songs.type == 'track') {

                    await queue(songs[0], interaction.user.id, interaction.user.tag)
                        .catch(err => {
                            let errorCode = logError(err, '13', interaction, guild, serverQueue);
                            return interaction.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                        });

                    const newSong = serverQueue.songs[serverQueue.songs.length - 1];

                    const queuedEmbed = new client.discordjs.MessageEmbed()
                        .setDescription(`[**${newSong.title} [${newSong.duration}]**](${newSong.url}) ${strings[guild.language].songQueued.replace('%POSNUM%', serverQueue.songs.length - 1)}`)
                        .setColor(65453);
                    
                    if (!interaction.replied) {
                        interaction.reply({ embeds: [queuedEmbed]});
                    }
                    else {
                        interaction.channel.send({ embeds: [queuedEmbed]});
                    }
                }
            } 
            else if (args.includes('youtube.com/') || args.includes('youtu.be/')) {

                const urlArray = args.split('/');

                const urlType = args.includes('youtube.com/') ?
                    urlArray[3].split('?')[0]:
                    'watch';

                if (urlType == 'watch') {

                    let videoId = args.includes('youtube.com/') ?
                        urlArray[3].split('=')[1]:
                        urlArray[3];
                    
                    videoId = videoId.split('&')[0];

                    const queueSong = await queue(videoId, interaction.user.id, interaction.user.tag)
                                                .catch(err => {
                                                    let errorCode = logError(err, '14', interaction, guild, serverQueue);
                                                    return interaction.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                                                });

                    if (!serverQueue.songs[0] || !queueSong) return;
                    
                    const newSong = serverQueue.songs[serverQueue.songs.length - 1];

                    const queuedEmbed = new client.discordjs.MessageEmbed()
                    .setDescription(`[**${newSong.title} [${newSong.duration}]**](${newSong.url}) ${strings[guild.language].songQueued.replace('%POSNUM%', serverQueue.songs.length - 1)}`)
                    .setColor(65453)
        
                    if (!interaction.replied) {
                        interaction.reply({ embeds: [queuedEmbed]});
                    }
                    else {
                        interaction.channel.send({ embeds: [queuedEmbed]});
                    }

                } else {
                    if (!interaction.replied) {
                        interaction.reply(strings[guild.language].botNotCompatibleWithYoutubePlaylists);
                    }
                    else {
                        interaction.channel.send(strings[guild.language].botNotCompatibleWithYoutubePlaylists);
                    }
                }              
            }
            else {

                if (!interaction.replied) {
                    interaction.reply(strings[guild.language].incompatibleLink);
                }
                else {
                    interaction.channel.send(strings[guild.language].incompatibleLink);
                }
            }
        }
    }

    async function queue(songName, requesterId, requesterUsertag, position) {

        if(ytdl.validateID(songName)) {

            let videoInfo = await ytdl.getBasicInfo('https://www.youtube.com/watch?v=' + songName);

            totalDurationSeconds = parseInt(videoInfo.player_response.videoDetails.lengthSeconds);
            videoTitle = videoInfo.player_response.videoDetails.title;
            videoId = songName;

            let durationHours = Math.floor(totalDurationSeconds / 3600);
            let durationMins = Math.floor((totalDurationSeconds % 3600) / 60);
            let durationSeconds = Math.round((totalDurationSeconds % 3600) % 60);
            
            if (durationHours && durationHours.toString().length == '1') {
                durationHours = '0' + durationHours
            }
            if (durationMins.toString().length == '1') {
                durationMins = '0' + durationMins
            }  
            if (durationSeconds.toString().length == '1') {
                durationSeconds = '0' + durationSeconds
            }

            duration = durationHours ? 
                durationHours + ':' + durationMins + ':' + durationSeconds:
                durationMins + ':' + durationSeconds;
        }
        else {

            const videoList = await youtubeSearch.GetListByKeyword(songName, false);

            let i = 0;
            let video = videoList.items[0];
    
            while (!videoList.items[i] || videoList.items[i].type !== 'video' || videoList.items[i].isLive || !videoList.items[i].length.simpleText) {
                video = videoList.items[i + 1];
                i++;
    
                if (!video) {
                    break
                }
            }
    
            if (!video) {
    
                if (!serverQueue.updating) {
                    serverQueue.textChannel.send(strings[guild.language].songNotFound.replace('%SONGNAME%', songName))
                }
                return
            }
    
            videoId = video.id;
            videoTitle = video.title;
    
            let length = video.length.simpleText;
            let durationArray = length.split(':');
            durationArray = durationArray.map(Number);
    
            totalDurationSeconds = 0;
    
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
        }

        const song = {
            title: videoTitle.replaceAll(`||`, `\\||`),
            duration: duration,
            durationSeconds: totalDurationSeconds,
            position: position,
            timeAtPlay: null,
            pauseTimestamps: [],
            url: 'https://www.youtube.com/watch?v=' + videoId,
            requesterId: requesterId,
            requesterUsertag: requesterUsertag
        };

        return serverQueue.songs.push(song);
    }

    async function play(song, queue, error) {
    
        if (!queue.player) {
    
            const player = voice.createAudioPlayer({
                behaviors: {
                    noSubscriber: voice.NoSubscriberBehavior.Pause,
                },
            });
    
            queue.player = player;
        }

        if (!song) return;

        if (!error && song.durationSeconds < 600) { // Temporary solution to player aborted ytdl-core bug for long videos

            const option = {
                filter: "audioonly",
                highWaterMark: 1 << 25,
                requestOptions: {
                    headers: {
                      cookie: client.config.youtubeCookie,
                      'x-youtube-identity-token': client.config.identityToken,
                    }
                }
            };

            const stream = await ytdl(`${song.url}&bpctr=99999999999999`, option); // Parameter to bypass sensitive content alert
    
            var resource = voice.createAudioResource(stream, {
                metadata: song
            });

        } else {

            const stream = youtubedl(`${song.url}&bpctr=99999999999999`, {
                o: '-',
                q: '',
                f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                r: '100K',
              }, { stdio: ['ignore', 'pipe', 'ignore'] })

            stream.catch(err => null);
        
            var resource = voice.createAudioResource(stream.stdout, {
                metadata: song
            });
        }

        queue.player.play(resource);
    
        const dispatcher = queue.connection
            .subscribe(queue.player)

        song.timeAtPlay = Date.now();
        song.pauseTimestamps = [];

        queue.playing = true;

        if (!error) {

            const nowPlayingEmbed = new client.discordjs.MessageEmbed()
            .setAuthor({ name: strings[guild.language].songNowPlaying, iconURL: client.user.displayAvatarURL({dynamic: true, size: 1024})})
            .setTitle(`${song.title} [${song.duration}]`)
            .setFooter({ text: strings[guild.language].songRequestedBy.replace('%REQUESTER%', song.requesterUsertag)})
            .setURL(song.url)
            .setColor(65453)

            const nowPlayingMsg = await queue.textChannel.send({ embeds: [nowPlayingEmbed]});

            queue.playingEmbed = nowPlayingMsg;
        }
    
        queue.player.once(voice.AudioPlayerStatus.Idle, () => {

            queue.playingEmbed.delete()
            .catch(err => null);

            if (!queue.playing) return;

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

                    queue.playing = false;
                    queue.player.stop(true);
                    queue.textChannel.send(strings[guild.language].botPlayerStoppedNoSongs)

                    queue.inactivity = setTimeout(() => {

                        if (!queue.playing && !queue.songs[0]) {

                            client.queue.delete(queue.textChannel.guild.id);
                            queue.textChannel.send(strings[guild.language].botInactiveForAMinute)
                            
                            if (serverQueue.connection._state.status != 'destroyed') {
                                serverQueue.connection.destroy();
                            }
                        }

                    }, 90 * 1000);
                }
            }
        });
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('play')
    .setDescription(strings['eng'].playHelpDescription)
    .addStringOption(option =>
        option.setName('query')
            .setRequired(false)
            .setDescription('Specify a song name to load and play.')
    )
    .addStringOption(option =>
        option.setName('link')
            .setRequired(false)
            .setDescription('Specify a song/playlist link from YouTube/Spotify to load and play.')
    )
    .addIntegerOption(option =>
        option.setName('offset')
            .setRequired(false)
            .setDescription('Song number to start loading from a provided playlist.')
    )
    .addBooleanOption(option =>
        option.setName('reverse')
            .setRequired(false)
            .setDescription('Load provided playlist starting from the last song.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}