module.exports = async (client, oldState, newState) => {

    const serverQueue = client.queue.get(oldState.guild.id);
    
    if (!serverQueue || !serverQueue.voiceChannel) return;

    const guild = await client.db.guild.findOne({ 
        id: oldState.guild.id,
    }).catch(err => console.log(err));

    if (serverQueue.voiceChannel === oldState.channel) {

        if (newState.channel !== oldState.channel || !newState.channel) {

            if (serverQueue.voiceChannel.members.size == 1 && oldState.id !== client.user.id) {

                clearTimeout(serverQueue.inactivity);

                serverQueue.inactivity = setTimeout(() => {

                    serverQueue.textChannel.send(strings[guild.language].botLeftAlone);

                    serverQueue.playing = false;
                    serverQueue.player.stop();

                    if (serverQueue.connection && serverQueue.connection._state.status != 'destroyed') {
                        serverQueue.connection.destroy();
                    }

                    client.queue.delete(oldState.guild.id);
            
                }, 10 * 1000);
            }
        }

        if (oldState.id == client.user.id && newState.channel !== oldState.channel) {

            if (!newState.channel) {
                
                clearTimeout(serverQueue.inactivity);

                serverQueue.playing = false;
                serverQueue.player.stop();
                
                client.queue.delete(oldState.guild.id);

                serverQueue.textChannel.send(strings[guild.language].botHasBeenDisconnected);

            } else {

                serverQueue.connection = client.discordjsvoice.getVoiceConnection(newState.guild.id);
                serverQueue.voiceChannel = newState.channel;
                serverQueue.textChannel.send(strings[guild.language].botHasBeenMoved.replace('%VOICECHANNEL%', serverQueue.voiceChannel.id).replace('%TEXTCHANNEL%', serverQueue.textChannel.id).replace('%PREFIX%', client.prefix));
                
                if (newState.channel.members.size == 1) {

                    clearTimeout(serverQueue.inactivity);

                    serverQueue.inactivity = setTimeout(() => {

                        serverQueue.textChannel.send(strings[guild.language].botLeftAlone);

                        serverQueue.playing = false;
                        serverQueue.player.stop();

                        if (serverQueue.connection._state.status != 'destroyed') {
                            serverQueue.connection.destroy();
                        }

                        client.queue.delete(oldState.guild.id);
                
                    }, 10 * 1000);
                }
            }
        }

    } else if (serverQueue.voiceChannel === newState.channel) {

        if (serverQueue.inactivity && serverQueue.inactivity._idleTimeout == 10000) {
            clearTimeout(serverQueue.inactivity);
            serverQueue.inactivity = null;
        }
    }
}