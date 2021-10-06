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

    if (!args[0] || !args[1] || isNaN(args[0]) || isNaN(args[1])) {
        return message.reply(`Debes especificar correctamente el número de la canción que deseas mover y a qué posición, utiliza \`${client.prefix}queue\` para ver la cola y la numeración de las canciones`)
    }

    const songNum = parseInt(args[0]);
    const posNum = parseInt(args[1]);

    if (serverQueue.songs.length <= 2) {
        return message.reply('No hay suficientes canciones en la cola para mover')
    }

    if (songNum >= serverQueue.songs.length || songNum == 0) {
        return message.reply(`Ese número (${songNum}) no corresponde a una canción, utiliza \`${client.prefix}queue\` para ver la cola y la numeración de las canciones`)
    }

    if (posNum >= serverQueue.songs.length || posNum == 0) {
        return message.reply(`Ese número (${posNum}) no corresponde a una posición existente en la cola, utiliza \`${client.prefix}queue\` para ver la cola y la numeración de las canciones`)
    }

    var songToMove = serverQueue.songs[songNum];
    serverQueue.songs.splice(songNum, 1);
    serverQueue.songs.splice(posNum, 0, songToMove);

    message.channel.send(`**${songToMove.title}** ha sido movido de la posición ${songNum} a la posición **${posNum}** de ${serverQueue.songs.length - 1}`)
}

module.exports.help = {
    name: "move",
    description: "Mover una canción de posición en la cola",
    usage: "Utilizar el comando seguido del número de la canción que se desea mover y del número de la posición que desea que ocupe",
    alias: "m"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}