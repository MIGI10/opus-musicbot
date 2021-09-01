module.exports = (client) => {
    
    var readymsg = `Bot is now UP as ${client.user.tag} at ${client.readyAt}`;
    
    console.log(`-----------------------\n\n${readymsg}\n\n-----------------------`);
    client.channels.fetch('846059980841943040')
    .then(channel => {
        channel.send(readymsg + ' <@487448257954316298>');
    });

    client.user.setPresence({
        activities: [{ 
            name: `${client.prefix}help`,
            type: 'LISTENING'
        }],
        status: 'idle'
    })
}