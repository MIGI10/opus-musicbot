const spaChangelog = require('../changelog/changelog-spa.json');
const engChangelog = require('../changelog/changelog-eng.json');

module.exports.run = async (client, message, args, guild) => {
    
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
    
    message.channel.send({ embeds: [changelogEmbed]})
}

module.exports.info = {
    name: "changelog",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}