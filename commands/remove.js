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

    if (!args[0] || isNaN(args[0])) {
        return message.reply(`Debes especificar el número de la canción que deseas eliminar, utiliza \`${client.prefix}queue\` para ver la cola y la numeración de las canciones`)
    }

    const songNum = parseInt(args[0]);

    if (serverQueue.songs.length <= 1) {
        return message.reply('No hay canciones en la cola para eliminar')
    }

    if (songNum >= serverQueue.songs.length || songNum == 0) {
        return message.reply(`Ese número (${songNum}) no corresponde a una canción, utiliza \`${client.prefix}queue\` para ver la cola y la numeración de las canciones`)
    }

    message.channel.send(`**${serverQueue.songs[songNum].title}** ha sido eliminado`)

    serverQueue.songs.splice(songNum, 1);
}

module.exports.help = {
    name: "remove",
    description: "Eliminar una canción de la cola de música",
    usage: "Utilizar el comando seguido del número que corresponde a la canción que desea eliminar, los números de cada canción se pueden ver con el comando `queue`",
    alias: "rem"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}