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
        return message.reply('No hay nada sonando ahora mismo')
    }

    if (serverQueue.loop) {
        serverQueue.loop = false;
        return message.channel.send('La reproducción en bucle ha sido desactivada')
    } else {
        serverQueue.loop = true;
        return message.channel.send(`La reproducción en bucle ha sido activada para **${serverQueue.songs[0].title}** [${serverQueue.songs[0].duration}]`)
    }
}

module.exports.help = {
    name: "loop",
    description: "Activa la reproducción en bucle de la canción que está sonando en ese momento",
    usage: "Usar solamente el comando para activar y desactivar",
    alias: "lo"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}