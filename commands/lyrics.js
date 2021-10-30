module.exports.run = async (client, message, args) => {

    const serverQueue = client.queue.get(message.guild.id);

    if (args[0]) {
        var songName = args.join(' ');
    } else {
        if (serverQueue) {
            var songName = serverQueue.songs[0] ? 
                serverQueue.songs[0].title:
                undefined
        }
    }

    if (!songName) {
        return message.reply('Debes especificar el nombre de una canción');
    }

    const searches = await client.geniusapi.songs.search(songName);

    const firstSong = searches[0];

    if (!firstSong) {
        return message.reply(`No se ha podido encontrar lyrics al buscar: **${songName}**`);
    }

    const lyrics = await firstSong.lyrics();

    if (lyrics.length >= 2000) {

        let stringArray = lyrics.split('\n\n');

        let embedContents = '';
        let i = 0;

        while (stringArray[0]) {

            while (embedContents.length < 1500 && stringArray[0]) {

                embedContents = embedContents.concat(stringArray[0] + '\n\n');
                stringArray.splice(0, 1);
            }

            const lyricsEmbed = i == 0 ?
                new client.discordjs.MessageEmbed()
                    .setAuthor(`Lyrics "${songName}"`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
                    .setDescription(embedContents)
                    .setColor(65453):
                new client.discordjs.MessageEmbed()
                    .setDescription(embedContents)
                    .setColor(65453)
            
            message.channel.send({ embeds: [lyricsEmbed]})

            embedContents = '';
            i++;
        }

    } else {

        const lyricsEmbed = new client.discordjs.MessageEmbed()
        .setAuthor(`Lyrics "${songName}"`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
        .setDescription(lyrics)
        .setColor(65453)

        message.channel.send({ embeds: [lyricsEmbed]})
    }
}

module.exports.help = {
    name: "lyrics",
    description: "Muestra el lyrics de la canción que actualmente está sonando o de una canción especificada",
    usage: "Usar solamente el comando si está sonando una canción para ver el lyrics de la misma o especificar el nombre de una canción con el comando para ver su lyrics",
    alias: "ly"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}