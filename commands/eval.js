module.exports.run = async (client, interaction) => {

    const code = interaction.options.getString('code');

    try {
        var evaled = await eval(code);
    } catch (err) {
        interaction.channel.send(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
    }

    const evalEmbed = new client.discordjs.MessageEmbed()
        .setColor('RANDOM')
        .addFields(
            { name: '**Input:**', value: `\`\`\`js\n${code}\`\`\``, inline: false },
            { name: '**Output:**', value: `\`\`\`js\n${evaled}\`\`\``, inline: false }
        )

        interaction.reply({ embeds: [evalEmbed]})
}

module.exports.data = new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluate JavaScript code.')
    .addStringOption(option =>
        option.setName('code')
            .setRequired(true)
            .setDescription('Code to evaluate.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: true
}