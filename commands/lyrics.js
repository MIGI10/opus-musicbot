module.exports.run = async (client, message, args, guild) => {

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
        return message.reply(strings[guild.language].userMustSpecifySongLyrics);
    }

    const searches = await client.geniusapi.songs.search(songName);

    const firstSong = searches[0];

    if (!firstSong) {
        return message.reply(strings[guild.language].noLyricsFound.replace("%SONGNAME%", songName));
    }

    const lyrics = await firstSong.lyrics();

    if (lyrics.length >= 2000) {

        let stringArray = lyrics.split('\n\n');

        let embedContents = '';
        let i = 0;

        while (stringArray[0] && i < 4) {

            while (embedContents.length < 1500 && stringArray[0]) {

                embedContents = embedContents.concat(stringArray[0] + '\n\n');
                stringArray.splice(0, 1);
            }

            const lyricsEmbed = i == 0 ?
                new client.discordjs.MessageEmbed()
                    .setAuthor({ name: `Lyrics "${songName}"`, iconURL: client.user.displayAvatarURL({dynamic: true, size: 1024})})
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
        .setAuthor({ name: `Lyrics "${songName}"`, iconURL: client.user.displayAvatarURL({dynamic: true, size: 1024})})
        .setDescription(lyrics)
        .setColor(65453)

        message.channel.send({ embeds: [lyricsEmbed]})
    }
}

module.exports.info = {
    name: "lyrics",
    alias: "ly"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}