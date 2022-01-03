const loadContent = require('../lib/loadContent');
const playSong = require('../lib/playSong');

module.exports.run = async (client, message, args, guild) => {

    if (!client.queue.get(message.guild.id)) { 
        client.queue.set(message.guild.id, {
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

    const serverQueue = client.queue.get(message.guild.id);

    if (!message.member.voice.channel && !serverQueue.voiceChannel) {
        client.queue.delete(message.guild.id);
        return message.reply(strings[guild.language].userNotConnectedToVoice)
    }

    if (serverQueue.voiceChannel) {

        if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
            return message.reply(strings[guild.language].userNotConnectedToSameVoice)
        }

        if (message.channel !== serverQueue.textChannel) {
            return message.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id).replace('%PREFIX%', client.prefix));
        }

        if (!serverQueue.playing) {

            if (!serverQueue.songs[0]) {

                if (!args[0]) {
                    return message.reply(strings[guild.language].userMustSpecifySongToStartPlayer)
                } 
                else {
                    clearTimeout(serverQueue.inactivity);
                    serverQueue.inactivity = null;

                    await loadContent(client, message, args, serverQueue, guild)
                        .catch(err => {
                            let errorCode = logError(err, '10', message, guild, serverQueue);
                            return message.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                        });
                    await playSong(client, serverQueue.songs[0], serverQueue, false, guild)
                        .catch(err => {
                            logError(err, '30', message, guild, serverQueue);
                        });

                    return;
                }
            } 
            else {
                    clearTimeout(serverQueue.inactivity);
                    serverQueue.inactivity = null;
                    serverQueue.player.unpause();
                    serverQueue.songs[0].pauseTimestamps[serverQueue.songs[0].pauseTimestamps.length - 1].timeAtUnpause = Date.now();
                    serverQueue.playing = true;

                    message.channel.send(strings[guild.language].botPlayerResumed)
            }
        } 
        else {

            if (!args[0]) {
                return message.reply(strings[guild.language].userMustSpecifySongToQueue);
            } 
            else {
                return loadContent(client, message, args, serverQueue, guild)
                    .catch(err => {
                        let errorCode = logError(err, '10', message, guild, serverQueue);
                        return message.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
                    });
            }
        }
    } 
    else {

        if (!args[0]) {
            client.queue.delete(message.guild.id);
            return message.reply(strings[guild.language].userMustSpecifySongToStartPlayer)
        }

        const voiceChannel = message.member.voice.channel;
        serverQueue.voiceChannel = voiceChannel;

        const textChannel = message.channel;
        serverQueue.textChannel = textChannel;

        message.channel.send(strings[guild.language].botConnectingToVoice.replace('%VOICECHANNELID%', voiceChannel.id));

        const permissions = voiceChannel.permissionsFor(message.guild.me);
        if (!permissions.has("VIEW_CHANNEL") || !permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            client.queue.delete(message.guild.id);
            return message.channel.send(strings[guild.language].botNeedsPermsToConnect);
        }
        
        await loadContent(client, message, args, serverQueue, guild)
            .catch(err => {
                let errorCode = logError(err, '10', message, guild, serverQueue);
                return message.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
            });

        
        /*
        await client.threadPool.exec({
            task: loadContent(client, message, args, serverQueue, guild),
            param: 1
        })
            .catch(err => {
                let errorCode = logError(err, '10', message, guild, serverQueue);
                return message.channel.send(strings[guild.language].botCouldNotQueue.replace('%ERRORCODE%', errorCode));
            });
        */
        
        try {
            var connection = client.discordjsvoice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guildId,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            serverQueue.connection = connection;

        } catch (err) {

            client.queue.delete(message.guild.id);

            let errorCode = logError(err, '20', message, guild, serverQueue);

            return message.channel.send(strings[guild.language].botCouldNotConnect).replace('%ERRORCODE%', errorCode);
        }

        await playSong(client, serverQueue.songs[0], serverQueue, false, guild)
            .catch(err => {
                logError(err, '30', message, guild, serverQueue);
            });

        serverQueue.player.on("error", async (error) => {

            const idleFunction = serverQueue.player.listeners(client.discordjsvoice.AudioPlayerStatus.Idle)[0];
            serverQueue.player.removeListener(client.discordjsvoice.AudioPlayerStatus.Idle, idleFunction);

            let errorCode = await logError(error, '40', null, guild, serverQueue);

            if (error.message.includes('403')) { // Temporary solution to random 403 errors from ytdl-core bug

                await playSong(client, error.resource.metadata, serverQueue, true, guild)
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

                client.queue.delete(message.guild.id);

                return;
            }
            else {

                serverQueue.textChannel.send(strings[guild.language].botCouldNotPlaySong.replace('%ERRORCODE%', errorCode));
                return idleFunction();
            }
        });
    }
}

module.exports.info = {
    name: "play",
    alias: "p"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}