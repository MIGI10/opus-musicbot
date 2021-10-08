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

    serverQueue.textChannel.send(`Reproductor detenido, abandonando **<#${serverQueue.voiceChannel.id}>**`);

    serverQueue.connection.destroy();

    client.queue.delete(message.guild.id);
}

module.exports.help = {
    name: "leave",
    description: "Parar el reproductor, limpiar la cola de música y abandonar el canal de voz",
    usage: "Utilizar solamente el comando",
    alias: "l"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}