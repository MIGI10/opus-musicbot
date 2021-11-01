module.exports.run = async (client, message, args, guild) => {

    if (!guild) {

        const MessageActionRow = client.discordjs.MessageActionRow;
        const MessageButton = client.discordjs.MessageButton;
    
        let spanishButton = new MessageButton()
            .setCustomId('spa_button')
            .setLabel('Español')
            .setStyle('PRIMARY');
    
        let englishButton = new MessageButton()
            .setCustomId('eng_button')
            .setLabel('English')
            .setStyle('PRIMARY');
    
        let row = new MessageActionRow()
            .addComponents(
                spanishButton,
                englishButton
            );

        if (message.member.permissions.has('MANAGE_MESSAGES', true)) {

            const setupMsg = await message.channel.send({ content: 'Escoge un idioma:\nChoose a language:', components: [row]});

            const filter = i => i.member.id === message.author.id;

            const collector = message.channel.createMessageComponentCollector({
                    filter, 
                    time: 30000 
                });

            collector.once('collect', async int => {
                
                if (int.customId == 'spa_button') {
                    lang = 'spa';
                }

                if (int.customId == 'eng_button') {
                    lang = 'eng';
                }

                setupMsg.edit({ components: [] });

                setupMsg.edit(strings[lang].setupMsg.replace('%GUILDNAME%', message.guild.name).replaceAll('%PREFIX%', client.prefix))
            
                let msgFilter = m => m.author.id == message.author.id && m.content.split(' ')[0].length > 15;

                message.channel.awaitMessages({
                    msgFilter,
                    max: 1,
                    time: 120000,
                    errors: ['time']
                })
                .then(async (collected) => {
                    modRole = collected.first().content;

                    const guildRoles = await message.guild.roles.fetch();

                    if (guildRoles.has(modRole)) {

                        const owner = await message.guild.fetchOwner();

                        const guildDoc = new client.db.guild({
                            id: message.guild.id,
                            name: message.guild.name,
                            language: lang,
                            memberCount: message.guild.memberCount,
                            ownerId: message.guild.ownerId,
                            ownerTag: owner.user.tag,
                            modRoleId: modRole,
                            joinedAt: message.guild.joinedAt,
                            createdAt: message.guild.createdAt,
                            isPartnered: message.guild.partnered,
                            isVerified: message.guild.verified,
                            boostCount: message.guild.premiumSubscriptionCount,
                            description: message.guild.description
                        })

                        await guildDoc.save().catch(err => console.log(err));

                        setupMsg.edit(strings[lang].setupComplete.replace('%PREFIX%', client.prefix));
                        
                    } else {
                        setupMsg.edit(strings[lang].setupInvalidRole);
                    }
                })
                .catch(collected => {
                    return setupMsg.edit(strings[lang].setupTimeout.replace('%USER%', message.author.id));
                });
            });

            collector.once('end', collected => {

                if (collected.size === 0) {
                    setupMsg.edit({ components: [] });
                    return setupMsg.edit(`No se ha escogido ningún idioma, vuelve a ejecutar el comando.\nNo language has been selected, execute the command again.`);
                }
            });

        } else {
            message.reply(`Solamente los usuarios con el permiso \`MANAGE_MESSAGES\` pueden iniciar la configuración\nOnly users with \`MANAGE_MESSAGES\` permission can start the configuration`)
        }

    } else {

        if (message.member.roles.cache.has(guild.modRoleId)) {

            if (!args[0]) {

                message.channel.send(strings[guild.language].configInstructions);
            
            } else {

                if (args[0] === 'spa') {

                    guild.language = 'spa';

                    await guild.save().catch(err => console.log(err));

                    message.channel.send(strings['spa'].configLanguageUpdated);

                } else if (args[0] === 'eng') {

                    guild.language = 'eng';

                    await guild.save().catch(err => console.log(err));

                    message.channel.send(strings['eng'].configLanguageUpdated);

                } else if (args[0].length > 15) {

                    const guildRoles = await message.guild.roles.fetch();

                    if (guildRoles.has(args[0])) {

                        guild.modRoleId = args[0];

                        await guild.save().catch(err => console.log(err));

                        message.channel.send(strings[guild.language].configModRoleUodated)
                        
                    } else {
                        message.channel.send(strings[guild.language].setupInvalidRole)
                    }
                } else {
                    message.reply(strings[guild.language].configMustSpecifySomething)
                }
            } 
        } else {
            message.reply(strings[guild.language].configNotAMod)
        }
    }
}

module.exports.info = {
    name: "config",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}