module.exports = async (client, interaction) => {

    if (!interaction.isCommand()) return;

    const cmd = client.commands.get(interaction.commandName)

    if (!cmd) return;

    if (!interaction.channel.permissionsFor(client.user.id).has('SEND_MESSAGES')) {

        interaction.user.createDM().then(channel => {
            channel.send(strings['spa'].botUnableToReply + '\n' + strings['eng'].botUnableToReply)
                .catch(err => null);
        });
        return;
    }

    const guild = await client.db.guild.findOne({
        id: interaction.guildId,
    }).catch(err => console.log(err));

    if (!guild && interaction.commandName !== 'config') {
        return interaction.reply(strings['spa'].guildNotConfigured + '\n' + strings['eng'].guildNotConfigured);
    }

    const isMod = interaction.member.roles.cache.has(client.config.modRoleID);

    if (cmd.requirements.devOnly && !client.config.botOwnerID.includes(interaction.user.id)) return;

    if (cmd.requirements.modOnly && !isMod && !client.config.botOwnerID.includes(interaction.user.id))
        return interaction.reply(strings[guild.language].botRestrictedCommand);
    
    if (cmd.requirements.userPerms && !interaction.member.permissions.has(cmd.requirements.userPerms))
        return interaction.reply(strings[guild.language].userNeedsPerms.replace('%PERMS%', cmd.requirements.userPerms.join(' ')));

    if (cmd.requirements.clientPerms && !interaction.guild.me.permissions.has(cmd.requirements.clientPerms))
        return interaction.reply(strings[guild.language].botNeedsPerms.replace('%PERMS%', cmd.requirements.clientPerms.join(' ')));

    cmd.run(client, interaction, guild);
}