module.exports = async (client) => {
    
    var readymsg = `Bot is now UP as ${client.user.tag} at ${client.readyAt}`;
    
    console.log(`-----------------------\n\n${readymsg}\n\n-----------------------`);
    client.channels.fetch(client.config.informChannel)
    .then(channel => {
        channel.send(`${readymsg} <@${client.config.botOwnerID}>`);
    });

    client.user.setPresence({
        activities: [{ 
            name: `${client.prefix}help`,
            type: 'LISTENING'
        }],
        status: 'online'
    })

    setTimeout(updateGuildInfo, 10000);
    setInterval(updateGuildInfo, 86400*1000);

    async function updateGuildInfo() {

        const guilds = await client.db.guild.find();

        for (const guild of guilds) {

            const guildInfo = await client.guilds.fetch(guild.id);

            const owner = await guildInfo.fetchOwner();

            guild.updateOne(
                { $set: { 
                    name: guildInfo.name,
                    memberCount: guildInfo.memberCount,
                    ownerId: guildInfo.ownerId,
                    ownerTag: owner.user.tag,
                    isPartnered: guildInfo.partnered,
                    isVerified: guildInfo.verified,
                    boostCount: guildInfo.premiumSubscriptionCount,
                    description: guildInfo.description,
                }}, (error) => {
                if (error) console.log(error);
            });

            await guild.save().catch(err => console.log(err));
        }
    }
}