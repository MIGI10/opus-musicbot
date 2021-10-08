module.exports.run = (client, message, args) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡No estoy actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>, puedes usar \`${client.prefix}transfer\` para cambiar el canal de texto de la sesión`)
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (!serverQueue.songs[0]) {
        return message.reply('No hay canciones en la cola')
    }

    if (serverQueue.shuffle) {
        serverQueue.shuffle = false;
        return message.channel.send('La reproducción aleatoria ha sido desactivada')
    } else {
        serverQueue.shuffle = true;
        return message.channel.send('La reproducción aleatoria ha sido activada')
    }
}

module.exports.help = {
    name: "shuffle",
    description: "Activa la reproducción aleatoria de las canciones en la cola",
    usage: "Usar solamente el comando para activar y desactivar",
    alias: "sh"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}