const ytdl = require('ytdl-core');

module.exports.run = async (client, message, args) => {

    voice = client.discordjsvoice

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡El bot no está actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>, puedes usar \`${client.prefix}transfer\` para cambiar el canal de texto de la sesión`)
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (!serverQueue.playing) {
        return message.reply('El reproductor está detenido')
    }

    const usersConnected = serverQueue.voiceChannel.members.size - 1;

    if (usersConnected <= 2) {

        await skip();

    } else {

        message.channel.send(`Para saltar la canción actual, ${(Math.ceil(usersConnected*0.5))-1} personas más de las ${usersConnected} conectadas deben enviar \`${client.prefix}skip\` en menos de 20 segundos.`);

        let filter = m => m.content.split(' ')[0] == `${client.prefix}skip` && m.author.id !== message.author.id && m.member.voice.channel && m.member.voice.channel == serverQueue.voiceChannel;

        message.channel.awaitMessages({
            filter,
            max: ((Math.ceil(usersConnected*0.5))-1),
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

        if (serverQueue.loop) {

            return play(serverQueue.songs[0]);

        } else {

            serverQueue.songs.shift();

            if (serverQueue.songs.length >= 1) {

                if (serverQueue.shuffle) {

                    const totalSongs = serverQueue.songs.length;
                    let randomSong = Math.floor(Math.random() * (totalSongs + 1)) - 1;

                    if (randomSong < 0) {
                        randomSong = 0;
                    }

                    var songToMove = serverQueue.songs[randomSong];
                    serverQueue.songs.splice(randomSong, 1);
                    serverQueue.songs.splice(0, 0, songToMove);

                    return play(serverQueue.songs[0]);

                } else {

                    return play(serverQueue.songs[0]);
                }
        
            } else {
                
                if (serverQueue.playing) {

                    serverQueue.playing = false;
                    serverQueue.player.stop();
                    serverQueue.textChannel.send('No hay más canciones en la cola, reproductor detenido')

                    serverQueue.inactivity = setTimeout(() => {

                        if (!serverQueue.playing && !serverQueue.songs[0]) {

                            client.queue.delete(serverQueue.textChannel.guild.id);
                            serverQueue.textChannel.send('He estado inactivo durante más de un minuto, canal de voz abandonado')
                            return serverQueue.connection.destroy();
                        }

                    }, 90 * 1000);
                }
            }
        }
    }

    async function play(song) {

        const option = {
            filter: "audioonly",
            highWaterMark: 1 << 25,
        };
        const stream = await ytdl(song.url, option);

        const resource = voice.createAudioResource(stream, {
            metadata: song
        });

        serverQueue.player.play(resource);

        song.timeAtPlay = Date.now();
        song.pauseTimestamps = [];

        serverQueue.textChannel.send(`Reproduciendo **${song.title}** [${song.duration}] || Solicitado por \`${song.requesterUsertag}\``);
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
    modOnly: false,
    devOnly: false
}