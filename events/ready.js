module.exports = (client) => {
    
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
}