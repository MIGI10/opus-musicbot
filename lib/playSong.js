const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec').raw;

module.exports = play;

async function play(client, song, queue, errorOccurred, guild) {

    const voice = client.discordjsvoice;
    
    if (!queue.player) {

        const player = voice.createAudioPlayer({
            behaviors: {
                noSubscriber: voice.NoSubscriberBehavior.Pause,
            },
        });

        queue.player = player;
    }

    if (!song) return;

    if (!errorOccurred && song.durationSeconds < 600) { // Temporary solution to player aborted ytdl-core bug for long videos

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
    queue.connection.subscribe(queue.player)

    song.timeAtPlay = Date.now();
    song.pauseTimestamps = [];

    queue.playing = true;

    if (!errorOccurred) {

        const nowPlayingEmbed = new client.discordjs.MessageEmbed()
        .setAuthor(strings[guild.language].songNowPlaying, client.user.displayAvatarURL({dynamic: true, size: 1024}))
        .setTitle(`${song.title} [${song.duration}]`)
        .setFooter(strings[guild.language].songRequestedBy.replace('%REQUESTER%', song.requesterUsertag))
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