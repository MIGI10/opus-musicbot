module.exports.run = (client, interaction, guild) => {

    if (!client.queue.get(interaction.guildId) || !client.queue.get(interaction.guildId).connection) {
        return interaction.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(interaction.guildId);

    if (!interaction.member.voice.channel || interaction.member.voice.channel != serverQueue.voiceChannel) {
        return interaction.reply(strings[guild.language].userNotConnectedToSameVoice)
    }

    if (interaction.channel !== serverQueue.textChannel) {

        const permissions = interaction.channel.permissionsFor(interaction.guild.me);
        if (!permissions.has("VIEW_CHANNEL") || !permissions.has("SEND_MESSAGES")) {
            return interaction.reply(strings[guild.language].transferNeedPerms.replace('%CHANNEL%', interaction.channel.id).replace('%USER%', interaction.user.id));
        }

        serverQueue.textChannel.send(strings[guild.language].transferCompleteOldChannel.replace('%USER%', interaction.user.id).replace('%CHANNEL%', interaction.channel.id));
        interaction.reply(strings[guild.language].transferCompleteNewChannel);
        serverQueue.textChannel = interaction.channel;

    } else {

        if (interaction.mentions.channels.first()) {

            const mentionedChannel = interaction.mentions.channels.first();

            if (mentionedChannel == interaction.channel) {

                interaction.reply(strings[guild.language].transferSameChannel);

            } else {

                const permissions = mentionedChannel.permissionsFor(interaction.guild.me);
                if (!permissions.has("VIEW_CHANNEL") || !permissions.has("SEND_MESSAGES")) {
                    return interaction.reply(strings[guild.language].transferNeedPerms2);
                }

                interaction.reply(strings[guild.language].transferCompleteOldChannelMention.replace('%CHHANEL%', mentionedChannel.id));
                serverQueue.textChannel = mentionedChannel;
            }
        } else {
            interaction.reply(strings[guild.language].transferMustSpecifyChannel)
        }
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('transfer')
    .setDescription(strings['eng'].transferHelpDescription)
    .addChannelOption(option =>
        option.setName('channel')
            .setRequired(false)
            .setDescription('Specify a text channel to transfer session.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}