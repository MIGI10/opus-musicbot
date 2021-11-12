const youtubeSearch = require('youtube-search-api');
const fs = require("fs");
const path = require('path');

module.exports.run = async (client, message, args, guild) => {

    if (!args[0]) return message.reply(strings[guild.language].userMustSpecifySong)

    args = args.join(' ');

    const videoList = await youtubeSearch.GetListByKeyword(args, false);

    const writeStream = fs.createWriteStream(path.join(
        __dirname,
        "..",
        "searches",
        `${new Date().toISOString()}.log`
    ));

    for (const vid of videoList.items) {
        writeStream.write(`${JSON.stringify(vid, null, 4)}\n`)
    }

    writeStream.on('error', (err) => {
        console.error(err)
    });

    writeStream.end();

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
    .setAuthor(`${strings[guild.language].searchResults} "${args}"`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
    .setDescription(embedList)
    .setFooter(strings[guild.language].searchHowToPlay.replace('%PREFIX%', client.prefix))
    .setColor(65453)

    message.channel.send({ embeds: [videoListEmbed]});
}

module.exports.info = {
    name: "search",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}