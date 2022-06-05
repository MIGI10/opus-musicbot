module.exports = async (client) => {

    setTimeout(updateGuildInfo, 10*1000);
    setInterval(updateGuildInfo, 86400*1000); // every 24h
    
    async function updateGuildInfo() {

        const guilds = await client.db.guild.find();

        let i = 1;

        for (const guild of guilds) {

            setTimeout(async () => {

                const guildInfo = client.guilds.cache.get(guild.id);

                if (!guildInfo) {

                    console.log(`--- Removing unknown guild from database: ${guild.id} - ${guild.name} ---`);
                    await guild.deleteOne();
                }
                else {

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
                        }
                    );
    
                    await guild.save().catch(err => console.log(err));
                }

            }, i * 3000);

            i++;
        }
    }
}