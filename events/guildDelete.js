module.exports = async (client, guild) => {

    if (client.queue.get(guild.id)) {

        if (client.queue.get(guild.id).player && client.queue.get(guild.id).player.state.status != 'idle') {
            client.queue.get(guild.id).playing = false;
            client.queue.get(guild.id).player.stop();
        }

        client.queue.delete(guild.id);
    }

    const guildSaved = await client.db.guild.findOne({ 
        id: guild.id,
    }).catch(err => console.log(err));

    if (guildSaved) {
        await guildSaved.deleteOne();
    }

    console.log(`guildDelete | Left ${guild.name} with ${guild.memberCount} members`);
}