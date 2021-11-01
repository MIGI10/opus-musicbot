module.exports.run = async (client, message, args) => {

    var result = args.join(' ');

    try {
        var evaled = await eval(result);
    } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
    }

    const evalEmbed = new client.discordjs.MessageEmbed()
        .setColor('RANDOM')
        .addFields(
            { name: '**Input:**', value: `\`\`\`js\n${result}\`\`\``, inline: false },
            { name: '**Output:**', value: `\`\`\`js\n${evaled}\`\`\``, inline: false }
        )

    message.channel.send({ embeds: [evalEmbed]})
}

module.exports.info = {
    name: "eval",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: true
}