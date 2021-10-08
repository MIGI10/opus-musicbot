module.exports.run = (client, message, args) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡No estoy actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (!message.member.voice.channel || message.member.voice.channel != serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (message.channel !== serverQueue.textChannel) {

        const permissions = message.channel.permissionsFor(message.guild.me);
        if (!permissions.has("VIEW_CHANNEL") || !permissions.has("SEND_MESSAGES")) {
            return serverQueue.textChannel.send(`ERROR: Necesito el permiso de \`VER CANAL\` y \`ENVIAR MENSAJES\` en <#${message.channel.id}> <@${message.author.id}>`);
        }

        serverQueue.textChannel.send(`<@${message.author.id}> ha cambiado el canal de texto de la sesión, ahora solo responderé comandos ejecutados en <#${message.channel.id}>`);
        message.channel.send('Ahora responderé únicamente comandos ejecutados aquí');
        serverQueue.textChannel = message.channel;

    } else {

        if (message.mentions.channels.first()) {

            const mentionedChannel = message.mentions.channels.first();

            if (mentionedChannel == message.channel) {

                message.reply('¡Ese canal es el canal asignado actualmente!');

            } else {

                const permissions = mentionedChannel.permissionsFor(message.guild.me);
                if (!permissions.has("VIEW_CHANNEL") || !permissions.has("SEND_MESSAGES")) {
                    return message.reply('ERROR: Necesito el permiso de `VER CANAL` y `ENVIAR MENSAJES` en ese canal');
                }

                message.channel.send(`Ahora responderé únicamente comandos ejecutados en <#${mentionedChannel.id}>`);
                serverQueue.textChannel = mentionedChannel;
            }
        } else {
            message.reply('Debes mencionar el canal de texto que deseas asignarme o ejecutar el comando desde el canal deseado')
        }
    }
}

module.exports.help = {
    name: "transfer",
    description: "Cambiar el canal de texto donde debo responder a comandos (canal donde se ha usado `play` por primera vez en la sesión actual)",
    usage: "Utilizar solamente el comando en el nuevo canal a asignar o ejecutar el comando desde el canal actual y mencionar el nuevo canal a asignar",
    alias: "tr"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}