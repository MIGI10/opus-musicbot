const spotifyFetch = require('../spotify/reqContent');
const queueSong = require('./queueSong');

module.exports = async (client, message, args, queue, guild) => {

    if (queue.updating) {
        message.reply(strings[guild.language].botIsUpdating)
            .then(msg => setTimeout(() => { 
                msg.delete(); 
                message.delete()
                    .catch((err) => null);
            }, 5000))
        return;
    }

    const argsJoined = args.join(' ');

    if (!argsJoined.includes('http:') && !argsJoined.includes('https:') && !argsJoined.includes('www.') && !argsJoined.includes('open.') && !argsJoined.includes('youtube.')) {

        let queuedSong = await queueSong(argsJoined, message.author.id, message.author.tag, null, queue, guild)
            .catch(err => {
                let errorCode = logError(err, '11', message, guild, queue);
                return message.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
            });

        if (!queue.songs[0] || !queuedSong) return;

        const newSong = queue.songs[queue.songs.length - 1];

        const queuedEmbed = new client.discordjs.MessageEmbed()
            .setDescription(`[**${newSong.title} [${newSong.duration}]**](${newSong.url}) ${strings[guild.language].songQueued.replace('%POSNUM%', queue.songs.length - 1)}`)
            .setColor(65453);

        message.channel.send({ embeds: [queuedEmbed]});
    
    } else {
        
        if (argsJoined.includes('open.spotify.com/')) {

            const songs = await spotifyFetch(client, message, args, guild)
                .catch(err => {
                    let errorCode = logError(err, '15', message, guild, queue);
                    return message.channel.send(strings[guild.language].botCouldNotQueueSpotify.replace('%ERRORCODE%', errorCode));
                });

            if (!songs.type) return;

            let i = 1;

            if (songs.type == 'playlist' || songs.type == 'album' || songs.type == 'artist') {

                let queuedEmbed = new client.discordjs.MessageEmbed()
                    .setAuthor(strings[guild.language].songsBeingQueued, 'https://i.gifer.com/origin/6a/6af36f7b9c1ac8a7e9d7dbcaa479b616.gif')
                    .setColor(65453)
                    .setDescription('\n\n' + strings[guild.language].songsLoading.replace('%SONGCOUNT%', songs.length))

                const queuedMsg = await message.channel.send({ embeds: [queuedEmbed]});

                queue.updating = true;

                for (const song of songs) {

                    if (typeof song === 'string') {
                        
                        if (i == 1) {
                            await queueSong(song, message.author.id, message.author.tag, i, queue, guild)
                                .catch(err => {
                                    logError(err, '12', message, guild, queue);
                                });
                        } else {
                            queueSong(song, message.author.id, message.author.tag, i, queue, guild)
                                .catch(err => {
                                    logError(err, '12', message, guild, queue);
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

                                const sorted = queue.songs.filter(song => song.position).sort((a, b) => {
                                    return a.position - b.position;
                                })
                                
                                let firstSong = queue.songs.indexOf(queue.songs.find(element => element.position)) + 1;
                                let lastSong = queue.songs.indexOf(queue.songs.filter(element => element.position).pop()) + 1;

                                for await (const sortedSong of sorted) {
                                    sortedSong.position = null;
                                }

                                queue.songs.splice(firstSong, lastSong - firstSong);

                                for (let i = firstSong, j = 1; i < lastSong; i++, j++) {
                                    queue.songs.splice(i, 0, sorted[j]);
                                }

                                queue.updating = false;

                                queuedEmbed = new client.discordjs.MessageEmbed()
                                    .setDescription(strings[guild.language].songsQueued.replace('%SONGCOUNT%', i - 1).replace('%CONTENTNAME%', songs.contentName))
                                    .setAuthor(songs.contentName, songs.contentIcon)
                                    .setColor(65453);
                    
                                queuedMsg.edit({ embeds: [queuedEmbed]});

                            }, waitTime);
                        }

                        i++
                    }
                }

            } else if (songs.type == 'track') {

                await queueSong(songs[0], message.author.id, message.author.tag, null, queue, guild)
                    .catch(err => {
                        let errorCode = logError(err, '13', message, guild, queue);
                        return message.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                    });

                const newSong = queue.songs[queue.songs.length - 1];

                const queuedEmbed = new client.discordjs.MessageEmbed()
                    .setDescription(`[**${newSong.title} [${newSong.duration}]**](${newSong.url}) ${strings[guild.language].songQueued.replace('%POSNUM%', queue.songs.length - 1)}`)
                    .setColor(65453);
    
                message.channel.send({ embeds: [queuedEmbed]});
            }
        }

        if (argsJoined.includes('youtube.com/') || argsJoined.includes('youtu.be/')) {

            const urlArray = argsJoined.split('/');

            const urlType = argsJoined.includes('youtube.com/') ?
                urlArray[3].split('?')[0]:
                'watch';

            if (urlType == 'watch') {

                let videoId = argsJoined.includes('youtube.com/') ?
                    urlArray[3].split('=')[1]:
                    urlArray[3];
                
                videoId = videoId.split('&')[0];

                let queuedSong = await queueSong(videoId, message.author.id, message.author.tag, null, queue, guild)
                    .catch(err => {
                        let errorCode = logError(err, '14', message, guild, queue);
                        return message.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                    });

                if (!queue.songs[0] || !queuedSong) return;
                
                const newSong = queue.songs[queue.songs.length - 1];

                const queuedEmbed = new client.discordjs.MessageEmbed()
                .setDescription(`[**${newSong.title} [${newSong.duration}]**](${newSong.url}) ${strings[guild.language].songQueued.replace('%POSNUM%', queue.songs.length - 1)}`)
                .setColor(65453)
    
                message.channel.send({ embeds: [queuedEmbed]});

            } else {
                return message.channel.send(strings[guild.language].botNotCompatibleWithYoutubePlaylists)
            }              
        }
    }
}