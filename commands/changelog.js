const changelog = require('../changelog.json');

module.exports.run = async (client, message, args) => {
    
    const changelogEmbed = new client.discordjs.MessageEmbed()
        .setTitle(`Changelog | Opus Music Bot`)
        .setColor(65453)
        .setFooter(`Opus Music Bot v${client.config.version} · Desarrollado por migi28#7731`, client.user.displayAvatarURL({dynamic: true, size: 1024}))
    
    for (const version in changelog.versions) {

        let changes = '';

        for (const change of changelog.versions[version]) {
            changes = changes.concat(`\n- ${change}`);
        }

        changelogEmbed.addField(`v${version}`, changes);
    }
    
    message.channel.send({ embeds: [changelogEmbed]})
}

module.exports.help = {
    name: "changelog",
    description: "Muestra los cambios y actualizaciones del bot",
    usage: "Únicamente debe ejecutarse el comando",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}