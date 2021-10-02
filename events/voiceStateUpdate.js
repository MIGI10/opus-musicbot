module.exports = (client, oldState, newState) => {
    
    if (!client.queue.get(oldState.guild.id) || !client.queue.get(oldState.guild.id).connection) return;

    const serverQueue = client.queue.get(oldState.guild.id);

    if (serverQueue.voiceChannel === oldState.channel) {

        if (newState.channel !== oldState.channel || !newState.channel) {

            if (serverQueue.voiceChannel.members.size == 1 && oldState.id !== client.user.id) {

                serverQueue.textChannel.send('Me he quedado solo :(, abandonando canal de voz');
            
                serverQueue.connection.destroy();
                client.queue.delete(oldState.guild.id);
            }
        }

        if (oldState.id == client.user.id && newState.channel !== oldState.channel) {

            if (!newState.channel) {
            
                client.queue.delete(oldState.guild.id);
                serverQueue.textChannel.send('Alguien me ha desconectado, se ha limpiado la cola');

            } else {
                
                serverQueue.voiceChannel = newState.channel;
                serverQueue.textChannel.send(`Alguien me ha movido a <#${serverQueue.voiceChannel.id}> pero seguiré respondiendo únicamente comandos ejecutados aquí, en <#${serverQueue.textChannel.id}>. Para cambiar de canal de texto, utiliza \`${client.prefix}transfer\``);
            }
        }
    }
}