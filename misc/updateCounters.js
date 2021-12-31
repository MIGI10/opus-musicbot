module.exports = async (client) => {

    setInterval(updateCounters, 14400*1000); // every 4h

    async function updateCounters() {

        const supportServer = client.guilds.cache.get('904435056968351776');
        const serversChannel = await supportServer.channels.fetch('907960416032923689');
        const membersChannel = await supportServer.channels.fetch('907960481808007168');

        const serversChannelName = serversChannel.name;
        const membersChannelName = membersChannel.name;

        const guilds = client.guilds.cache;

        let memberCount = 0;

        guilds.forEach((guild) => {
            memberCount += guild.memberCount;
        })

        serversChannel.setName(serversChannelName.replace(/[0-9]+/g, guilds.size));
        membersChannel.setName(membersChannelName.replace(/[0-9]+/g, memberCount));
    }
}