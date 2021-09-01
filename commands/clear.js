module.exports.run = async (client, message, args) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡No estoy actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>`)
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (!serverQueue.songs[0]) {
        return message.reply('No hay canciones en la cola')
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    const guildSaved = await client.db.guild.findOne({ 
        id: message.guild.id,
    }).catch(err => console.log(err));

    if (usersConnected == 1 || message.member.roles.cache.has(guildSaved.modRoleId)) {

        await clear();

    } else {

        message.channel.send(`Para limpiar la cola del servidor, ${(Math.ceil(usersConnected*0,5))-1} personas más de las ${usersConnected} conectadas deben enviar \`${client.prefix}clear\` en menos de 20 segundos.`);

        let filter = m => m.content.split(' ')[0] == `${client.prefix}clear` && m.author.id !== message.author.id && m.member.voice.channel && m.member.voice.channel == serverQueue.voiceChannel;

        message.channel.awaitMessages({
            filter,
            max: ((Math.ceil(usersConnected*0,5))-1),
            time: 20000,
            errors: ['time']
        })
        .then(async collected => {
            if (collected.size == ((Math.ceil(usersConnected*0,5))-1)) {

                await clear();
            }
        })
        .catch(collected => {
            return message.channel.send(`Clear cancelado.`);
        });
    }

    async function clear() {

        serverQueue.playing = false;
        serverQueue.songs = [];
        serverQueue.player.stop();
        
        client.user.setPresence({
        activities: [{ 
            name: `${client.prefix}help | Reproductor detenido`,
            type: 'LISTENING'
        }],
        status: 'idle'
        })

        message.channel.send('Se ha limpiado la cola y se ha detenido el reproductor')
    }
}

module.exports.help = {
    name: "clear",
    description: "Limpiar la cola de música, al menos la mitad de los usuarios conectados deben estar de acuerdo",
    usage: "La mitad de las personas conectadas al canal de voz deben utilizar el comando en menos de 20 segundos a partir del primer `clear`",
    alias: "c"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}