const youtubeSearch = require('youtube-search-api');
const fs = require("fs");
const path = require('path');

module.exports.run = async (client, message, args) => {

    if (!args[0]) return message.reply('Debes especificar el nombre de una canción')

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

    let embedList = '';

    writeStream.end();

    for (let i = 1; i <= 6; i++) {

        j = i - 1;

        if (!videoList.items[j]) {
            j = i;
        } else if (videoList.items[j].type !== 'video') {
            j = i;
        } else if (videoList.items[j].isLive) {
            j = i;
        }

        embedList = embedList.concat(`**${i}.** [${videoList.items[j].title.replaceAll(`||`, `\\||`)}](https://www.youtube.com/watch?v=${videoList.items[j].id}) [${videoList.items[j].length.simpleText}]\nID: \`${videoList.items[j].id}\`\n\n`)
    }

    const videoListEmbed = new client.discordjs.MessageEmbed()
    .setAuthor(`Search Results "${args}"`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
    .setDescription(embedList)
    .setFooter('Para reproducir una canción: o!play <ID de la canción>')
    .setColor(65453)

    message.channel.send({ embeds: [videoListEmbed]});
}

module.exports.help = {
    name: "search",
    description: "Buscar una canción en YouTube",
    usage: "Usar el comando seguido del nombre de la canción",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}