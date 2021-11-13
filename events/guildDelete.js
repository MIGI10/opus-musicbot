module.exports = async (client, guild) => {

    const serverQueue = client.queue.get(guild.id);

    if (serverQueue) {

        if (serverQueue.player && serverQueue.player.state.status != 'idle') {
            serverQueue.playing = false;
            serverQueue.player.stop(true);
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