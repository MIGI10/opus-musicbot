module.exports.run = (client, message, args) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡No estoy actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>, puedes usar \`${client.prefix}transfer\` para cambiar el canal de texto de la sesión`)
    }

    if (!message.member.voice.channel || message.member.voice.channel != serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (!serverQueue.playing) {
        return message.reply('El reproductor ya está detenido')
    }

    serverQueue.playing = false;
    serverQueue.player.pause();

    const pauseTimestamp = {
        timeAtPause: Date.now(),
        timeAtUnpause: null,
    }

    serverQueue.songs[0].pauseTimestamps.push(pauseTimestamp);

    message.channel.send(`Reproductor pausado, para reanudar \`${client.prefix}play\``);

    serverQueue.inactivity = setTimeout(() => {

        if (!serverQueue.playing) {
            
            client.queue.delete(serverQueue.textChannel.guild.id);
            serverQueue.textChannel.send('He estado inactivo durante 3 minutos, canal de voz abandonado')
            
            if (serverQueue.connection._state.status != 'destroyed') {
                serverQueue.connection.destroy();
            }
        }

    }, 180 * 1000);
}

module.exports.help = {
    name: "pause",
    description: "Pausar el reproductor, para reanudar utiliza `play`",
    usage: "Utilizar solamente el comando",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}