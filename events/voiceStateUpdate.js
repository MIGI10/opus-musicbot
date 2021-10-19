module.exports = (client, oldState, newState) => {
    
    if (!client.queue.get(oldState.guild.id) || !client.queue.get(oldState.guild.id).connection) return;

    const serverQueue = client.queue.get(oldState.guild.id);

    if (serverQueue.voiceChannel === oldState.channel) {

        if (newState.channel !== oldState.channel || !newState.channel) {

            if (serverQueue.voiceChannel.members.size == 1 && oldState.id !== client.user.id) {

                serverQueue.inactivity = setTimeout(() => {

                    serverQueue.textChannel.send('Me he quedado solo :(, canal de voz abandonado');

                    if (serverQueue.connection._state.status != 'destroyed') {
                        serverQueue.connection.destroy();
                    }

                    client.queue.delete(oldState.guild.id);
            
                }, 10 * 1000);
            }
        }

        if (oldState.id == client.user.id && newState.channel !== oldState.channel) {

            if (!newState.channel) {
                
                clearTimeout(serverQueue.inactivity);
                client.queue.delete(oldState.guild.id);
                serverQueue.textChannel.send('Alguien me ha desconectado, se ha limpiado la cola');

            } else {

                serverQueue.connection = client.discordjsvoice.getVoiceConnection(newState.guild.id);
                serverQueue.voiceChannel = newState.channel;
                serverQueue.textChannel.send(`Alguien me ha movido a <#${serverQueue.voiceChannel.id}> pero seguiré respondiendo únicamente comandos ejecutados aquí, en <#${serverQueue.textChannel.id}>. Para cambiar de canal de texto, utiliza \`${client.prefix}transfer\``);
                
                if (newState.channel.members.size == 1) {

                    serverQueue.inactivity = setTimeout(() => {

                        serverQueue.textChannel.send('Me he quedado solo :(, canal de voz abandonado');

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