module.exports.run = (client, message, args, guild) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply(strings[guild.language].userNotConnectedToSameVoice)
    }

    if (message.channel !== serverQueue.textChannel) {

        const permissions = message.channel.permissionsFor(message.guild.me);
        if (!permissions.has("VIEW_CHANNEL") || !permissions.has("SEND_MESSAGES")) {
            return serverQueue.textChannel.send(strings[guild.language].transferNeedPerms.replace('%CHANNEL%', message.channel.id).replace('%USER%', message.author.id));
        }

        serverQueue.textChannel.send(strings[guild.language].transferCompleteOldChannel.replace('%USER%', message.author.id).replace('%CHANNEL%', message.channel.id));
        message.channel.send(strings[guild.language].transferCompleteNewChannel);
        serverQueue.textChannel = message.channel;

    } else {

        if (message.mentions.channels.first()) {

            const mentionedChannel = message.mentions.channels.first();

            if (mentionedChannel == message.channel) {

                message.reply(strings[guild.language].transferSameChannel);

            } else {

                const permissions = mentionedChannel.permissionsFor(message.guild.me);
                if (!permissions.has("VIEW_CHANNEL") || !permissions.has("SEND_MESSAGES")) {
                    return message.reply(strings[guild.language].transferNeedPerms2);
                }

                message.channel.send(strings[guild.language].transferCompleteOldChannelMention.replace('%CHHANEL%', mentionedChannel.id));
                serverQueue.textChannel = mentionedChannel;
            }
        } else {
            message.reply(strings[guild.language].transferMustSpecifyChannel)
        }
    }
}

module.exports.info = {
    name: "transfer",
    alias: "tr"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}