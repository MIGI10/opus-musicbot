module.exports.run = async (client, interaction, guild) => {

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

        if (interaction.member.permissions.has('MANAGE_MESSAGES', true)) {

            interaction.reply({ content: 'Escoge un idioma:\nChoose a language:', components: [row]});

            const filter = i => i.member.id === interaction.user.id;

            const collector = interaction.channel.createMessageComponentCollector({
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

                interaction.editReply({ components: [] });

                interaction.editReply(strings[lang].setupMsg.replace('%GUILDNAME%', interaction.guild.name))
            
                let msgFilter = m => m.author.id == interaction.user.id && m.content.split(' ')[0].length > 15;

                interaction.channel.awaitMessages({
                    msgFilter,
                    max: 1,
                    time: 120000,
                    errors: ['time']
                })
                .then(async (collected) => {
                    modRole = collected.first().content;

                    const guildRoles = await interaction.guild.roles.fetch();

                    if (guildRoles.has(modRole)) {

                        const owner = await interaction.guild.fetchOwner();

                        const guildDoc = new client.db.guild({
                            id: interaction.guildId,
                            name: interaction.guild.name,
                            language: lang,
                            memberCount: interaction.guild.memberCount,
                            ownerId: interaction.guild.ownerId,
                            ownerTag: owner.user.tag,
                            modRoleId: modRole,
                            joinedAt: interaction.guild.joinedAt,
                            createdAt: interaction.guild.createdAt,
                            isPartnered: interaction.guild.partnered,
                            isVerified: interaction.guild.verified,
                            boostCount: interaction.guild.premiumSubscriptionCount,
                            description: interaction.guild.description
                        })

                        await guildDoc.save().catch(err => console.log(err));

                        interaction.editReply(strings[lang].setupComplete);
                        
                    } else {
                        interaction.editReply(strings[lang].setupInvalidRole);
                    }
                })
                .catch(collected => {
                    return interaction.editReply(strings[lang].setupTimeout.replace('%USER%', interaction.user.id));
                });
            });

            collector.once('end', collected => {

                if (collected.size === 0) {
                    interaction.editReply({ components: [] });
                    return interaction.editReply(`No se ha escogido ningún idioma, vuelve a ejecutar el comando.\nNo language has been selected, execute the command again.`);
                }
            });

        } else {
            interaction.reply(`Solamente los usuarios con el permiso \`MANAGE_MESSAGES\` pueden iniciar la configuración\nOnly users with \`MANAGE_MESSAGES\` permission can start the configuration`)
        }

    } else {

        const langArg = interaction.options.getString('language');
        const modRoleArg = interaction.options.getRole('role');

        if (interaction.member.roles.cache.has(guild.modRoleId)) {

            if (!langArg && !modRoleArg) {

                interaction.reply(strings[guild.language].configInstructions);
            
            } else {

                if (langArg && langArg == 'config_spa') {

                    guild.language = 'spa';

                    await guild.save().catch(err => console.log(err));

                    interaction.reply(strings['spa'].configLanguageUpdated);

                } 
                else if (langArg && langArg == 'config_eng') {

                    guild.language = 'eng';

                    await guild.save().catch(err => console.log(err));

                    interaction.reply(strings['eng'].configLanguageUpdated);

                } 
                else {

                    const guildRoles = await interaction.guild.roles.fetch();

                    if (guildRoles.has(modRoleArg.id)) {

                        guild.modRoleId = modRoleArg.id;

                        await guild.save().catch(err => console.log(err));

                        interaction.reply(strings[guild.language].configModRoleUpdated);
                        
                    } 
                    else {

                        interaction.reply(strings[guild.language].setupInvalidRole);
                    }
                } 
            } 
        } else {

            interaction.reply(strings[guild.language].configNotAMod);
        }
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('config')
    .setDescription(strings['eng'].configHelpDescription)
    .addStringOption(option =>
        option.setName('language')
            .setRequired(false)
            .setDescription('Specify the language desired for bot responses.')
            .addChoice('English', 'config_eng')
            .addChoice('Spanish', 'config_spa')
    )
    .addRoleOption(option =>
        option.setName('role')
            .setRequired(false)
            .setDescription('Specify a moderator role to give elevated permissions.')
    )

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}