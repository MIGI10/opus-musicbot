const youtubeSearch = require('youtube-search-api');

module.exports.run = async (client, interaction, guild) => {

    const song = interaction.options.getString('song');

    if (!song) return interaction.reply(strings[guild.language].userMustSpecifySong)

    const videoList = await youtubeSearch.GetListByKeyword(song, false);

    let embedList = '';

    let j = 0;

    for (let i = 1; i <= 6; i++) {

        firstCheck = j;

        while (!videoList.items[j] || videoList.items[j].type !== 'video' || videoList.items[j].isLive || !videoList.items[j].length.simpleText) {
            j++;

            if (j >= (firstCheck + 10)) {
                break;
            }
        }

        if (j >= (firstCheck + 10)) {
            break;
        }

        embedList = embedList.concat(`**${i}.** [${videoList.items[j].title.replaceAll(`||`, `\\||`)}](https://www.youtube.com/watch?v=${videoList.items[j].id}) [${videoList.items[j].length.simpleText}]\nID: \`${videoList.items[j].id}\`\n\n`);
        
        j++;
    }

    const videoListEmbed = new client.discordjs.MessageEmbed()
    .setAuthor({ name: `${strings[guild.language].searchResults} "${song}"`, iconURL: client.user.displayAvatarURL({dynamic: true, size: 1024})})
    .setDescription(embedList)
    .setFooter({ text: strings[guild.language].searchHowToPlay})
    .setColor(65453)

    interaction.reply({ embeds: [videoListEmbed]});
}

module.exports.data = new SlashCommandBuilder()
    .setName('search')
    .setDescription(strings['eng'].searchHelpDescription)
    .addStringOption(option =>
        option.setName('song')
            .setRequired(true)
            .setDescription('Specify a song name to search.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}