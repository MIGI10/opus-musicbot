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
        return skip();
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    if (usersConnected <= 2) {

        await skip();

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

                await skip();   
            }
        })
        .catch(collected => {
            return msg.edit(strings[guild.language].skipCancelled);
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
                    serverQueue.textChannel.send(strings[guild.language].botPlayerStoppedNoSongs)

                    serverQueue.inactivity = setTimeout(() => {

                        if (!serverQueue.playing && !serverQueue.songs[0]) {

                            client.queue.delete(serverQueue.textChannel.guild.id);
                            serverQueue.textChannel.send(strings[guild.language].botInactiveForAMinute)
                            
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
        .setAuthor(strings[guild.language].songNowPlaying, client.user.displayAvatarURL({dynamic: true, size: 1024}))
        .setTitle(`${song.title} [${song.duration}]`)
        .setFooter(strings[guild.language].songRequestedBy.replace('%REQUESTER%', song.requesterUsertag))
        .setURL(song.url)
        .setColor(65453)

        const nowPlayingMsg = await serverQueue.textChannel.send({ embeds: [nowPlayingEmbed]});

        serverQueue.playingEmbed = nowPlayingMsg;
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