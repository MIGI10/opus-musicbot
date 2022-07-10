module.exports.run = async (client, interaction, guild) => {

    const serverQueue = client.queue.get(interaction.guildId);

    const songArg = interaction.options.getString('song');

    var songName;

    if (songArg) {
        songName = songArg;
    } 
    else if (serverQueue && serverQueue.songs[0]) {
        songName = serverQueue.songs[0].title;
    }
    else {
        songName = null;
    }

    if (!songName) {
        return interaction.reply(strings[guild.language].userMustSpecifySongLyrics);
    }

    const searches = await client.geniusapi.songs.search(songName);

    const firstSong = searches[0];

    if (!firstSong) {
        return interaction.reply(strings[guild.language].noLyricsFound.replace("%SONGNAME%", songName));
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
            
            if (interaction.replied) {

                interaction.channel.send({ embeds: [lyricsEmbed]});
            }
            else {

                interaction.reply({ embeds: [lyricsEmbed]});
            }

            embedContents = '';
            i++;
        }

    } else {

        const lyricsEmbed = new client.discordjs.MessageEmbed()
        .setAuthor({ name: `Lyrics "${songName}"`, iconURL: client.user.displayAvatarURL({dynamic: true, size: 1024})})
        .setDescription(lyrics)
        .setColor(65453)

        interaction.reply({ embeds: [lyricsEmbed]})
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription(strings['eng'].lyricsHelpDescription)
    .addStringOption(option =>
        option.setName('song')
            .setRequired(false)
            .setDescription('Specify a song to show its lyrics.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}