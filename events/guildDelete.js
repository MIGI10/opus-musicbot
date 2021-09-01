module.exports = async (client, guild) => {

    const guildSaved = await client.db.guild.findOne({ 
        id: guild.id,
    }).catch(err => console.log(err));

    if (guildSaved) {
        await guildSaved.deleteOne();
    }

    console.log(`guildDelete | Left ${guild.name} with ${guild.memberCount} members`);
}