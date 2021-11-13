module.exports = async (client) => {

    setInterval(updateCounters, 14400*1000); // every 4h

    async function updateCounters() {

        const supportServer = await client.guilds.fetch('904435056968351776');
        const serversChannel = await supportServer.channels.fetch('907960416032923689');
        const membersChannel = await supportServer.channels.fetch('907960481808007168');

        const serversChannelName = serversChannel.name;
        const membersChannelName = membersChannel.name;

        let memberCount = 0;

        const guilds = await client.guilds.fetch();

        let i = 1;

        guilds.forEach((guild) => {
            setTimeout(() => {
                guild.fetch().then((g) => {
                    memberCount += g.memberCount;
                })
            }, i * 3000);

            if (i >= guilds.size) {
                setTimeout(() => {
                    serversChannel.setName(serversChannelName.replace(/[0-9]+/g, guilds.size));
                    membersChannel.setName(membersChannelName.replace(/[0-9]+/g, memberCount));
                }, i * 3000);
            }

            i++
        })
    }
}