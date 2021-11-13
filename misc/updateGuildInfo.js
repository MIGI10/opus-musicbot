module.exports = async (client) => {

    setTimeout(updateGuildInfo, 10*1000);
    setInterval(updateGuildInfo, 86400*1000); // every 24h
    
    async function updateGuildInfo() {

        const guilds = await client.db.guild.find();

        let i = 1;

        for (const guild of guilds) {

            setTimeout(async () => {

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

            }, i * 3000);

            i++;
        }
    }
}