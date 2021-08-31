const ytdl = require('ytdl-core');

module.exports.run = async (client, message, args) => {

    voice = client.discordjsvoice

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡El bot no está actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`El bot está actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>`)
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (!serverQueue.playing) {
        return message.reply('El reproductor está detenido')
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    if (usersConnected == 1) {

        await skip();

    } else {

        message.channel.send(`Para saltar la canción actual, ${(Math.ceil(usersConnected*0,5))-1} personas más de las ${usersConnected} conectadas deben enviar \`${client.prefix}skip\` en menos de 20 segundos.`);

        let filter = m => m.content.split(' ')[0] == `${client.prefix}skip` && m.author.id !== message.author.id && m.member.voice.channel && m.member.voice.channel == serverQueue.voiceChannel;

        message.channel.awaitMessages({
            filter,
            max: ((Math.ceil(usersConnected*0,5))-1),
            time: 20000,
            errors: ['time']
        })
        .then(async collected => {
            if (collected.size == ((Math.ceil(usersConnected*0,5))-1)) {

                await skip();   
            }
        })
        .catch(collected => {
            return message.channel.send(`Skip cancelado.`);
        });
    }

    async function skip() {
        
        serverQueue.songs.shift();

        if (serverQueue.songs.length >= 1) {
    
            const song = serverQueue.songs[0];
            client.user.setPresence({
                activities: [{ 
                    name: song.title,
                    type: 'LISTENING'
                }],
                status: 'online'
            })
    
            const stream = ytdl(song.url, {
                inlineVolume: true,
                filter: "audioonly",
                opusEncoded: true,
                bitrate: 320,
                quality: "highestaudio",
                liveBuffer: 40000,
                highWaterMark: 1 << 32,
            });
    
            const resource = voice.createAudioResource(stream, {
                inlineVolume: true,
                metadata: song
            });
    
            serverQueue.player.play(resource);

            song.timeAtPlay = Date.now();

            serverQueue.textChannel.send(`Reproduciendo **${song.title}** [${song.duration}] || Solicitado por \`${song.requesterUsertag}\``);
    
        } else {
    
            client.user.setPresence({
                activities: [{ 
                    name: `${client.prefix}help | Reproductor detenido`,
                    type: 'LISTENING'
                }],
                status: 'idle'
            })
            
            if (serverQueue.playing) {
                client.queue.delete(queue.textChannel.guild.id);
                serverQueue.textChannel.send('No hay más canciones en la cola, canal de voz abandonado')
                return serverQueue.connection.destroy();
            }
        }
    }
}

module.exports.help = {
    name: "skip",
    description: "Saltar la canción que suena, al menos la mitad de los usuarios conectados deben estar de acuerdo",
    usage: "La mitad de las personas conectadas al canal de voz deben utilizar el comando en menos de 20 segundos a partir del primer `skip`",
    alias: "s"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}