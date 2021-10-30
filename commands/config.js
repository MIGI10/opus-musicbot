module.exports.run = async (client, message, args) => {

    const guildSaved = await client.db.guild.findOne({ 
        id: message.guild.id,
    }).catch(err => console.log(err));

    if (!guildSaved) {
        if (message.member.permissions.has('MANAGE_MESSAGES', true)) {
            message.channel.send(`¡Gracias por añadirme a **${message.guild.name}**!\n\nAntes de poder funcionar en el servidor, necesito que envíes por aquí la ID del rol de moderadores (los usuarios con este rol podrán utilizar \`${client.prefix}clear\` y \`${client.prefix}forceskip\` sin restricción aunque haya más de una persona conectada). En caso de no saber copiar la ID del rol, consulta este artículo: https://docs.discordsafe.com/docs/ayuda/copiar-ids`)
            
            let filter = m => m.author.id == message.author.id && m.content.split(' ')[0].length > 15;

            message.channel.awaitMessages({
                filter,
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
                        memberCount: message.guild.memberCount,
                        ownerId: message.guild.ownerId,
                        ownerTag: owner.user.tag, //
                        modRoleId: modRole,
                        joinedAt: message.guild.joinedAt,
                        createdAt: message.guild.createdAt,
                        isPartnered: message.guild.partnered,
                        isVerified: message.guild.verified,
                        boostCount: message.guild.premiumSubscriptionCount,
                        description: message.guild.description
                    })

                    await guildDoc.save().catch(err => console.log(err));

                    message.channel.send('¡He sido configurado con éxito!')
                     
                } else {
                    message.channel.send('Esa ID no corresponde a un rol del servidor, asegúrate de haber copiado correctamente la ID y vuelve a ejecutar el comando')
                }
            })
            .catch(collected => {
                return message.channel.send(`No he recibido la ID por parte de <@${message.author.id}>, vuelve a ejecutar el comando.`);
            });
        } else {
            message.reply(`Solamente un usuario con el permiso \`MANAGE_MESSAGES\` puede iniciar la configuración`)
        }
    } else {

        if (message.member.roles.cache.has(guildSaved.modRoleId)) {
            if (!args[0]) {
                message.channel.send('¡Ya estoy configurado y listo para funcionar! Si deseas modificar el rol de moderador guardado vuelve a ejecutar el comando seguido de la ID del rol que deseas asignar');
            } else {

                const guildRoles = await message.guild.roles.fetch();

                if (guildRoles.has(args[0])) {

                    guildSaved.modRoleId = args[0];

                    await guildSaved.save().catch(err => console.log(err));

                    message.channel.send('¡Se ha actualizado el rol de moderador con éxito!')
                     
                } else {
                    message.channel.send('Esa ID no corresponde a un rol del servidor, asegúrate de haber copiado correctamente la ID y vuelve a ejecutar el comando')
                }
            }
        } else {
            message.reply('¡No tienes permiso para ejecutar este comando!')
        }
    }
}

module.exports.help = {
    name: "config",
    description: "Configurar el bot para su uso en el servidor actual",
    usage: "Un moderador o administrador debe ejecutar el comando y seguir las instrucciones para configurar el bot",
    alias: ""
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}