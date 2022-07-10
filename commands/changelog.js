const spaChangelog = require('../changelog/changelog-spa.json');
const engChangelog = require('../changelog/changelog-eng.json');

module.exports.run = async (client, interaction, guild) => {
    
    const changelogEmbed = new client.discordjs.MessageEmbed()
        .setTitle(`Changelog | Opus Music Bot`)
        .setColor(65453)
        .setFooter(`Opus Music Bot v${client.config.version} · ${strings[guild.language].botDevelopedBy}`, client.user.displayAvatarURL({dynamic: true, size: 1024}))

    if (guild.language == 'spa') {
        changelog = spaChangelog;
    } else {
        changelog = engChangelog;
    }
    
    for (const version in changelog.versions) {

        let changes = '';

        for (const change of changelog.versions[version]) {
            changes = changes.concat(`\n- ${change}`);
        }

        changelogEmbed.addField(`v${version}`, changes);
    }
    
    interaction.reply({ embeds: [changelogEmbed]})
}

module.exports.data = new SlashCommandBuilder()
    .setName('changelog')
    .setDescription(strings['eng'].changelogHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}