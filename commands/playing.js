module.exports.run = async (client, message, args) => {

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡No estoy actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>`)
    }

    if (!message.member.voice.channel || message.member.voice.channel !== serverQueue.voiceChannel) {
        return message.reply('¡No estás conectado al mismo canal de voz que yo!')
    }

    if (!serverQueue.songs[0]) {
        return message.reply('No hay nada sonando ahora mismo')
    }

    if (serverQueue.loop) {
        loopStatus = '🟢';
    } else {
        loopStatus = '🔴';
    }

    if (serverQueue.shuffle) {
        shuffleStatus = '🟢';
    } else {
        shuffleStatus = '🔴';
    }

    if (!serverQueue.playing) {
        scrubberEmoji = '⏸';
    } else {
        scrubberEmoji = '🔘';
    }

    const currentTime = Date.now();

    const pauseTimestamps = serverQueue.songs[0].pauseTimestamps;

    if (pauseTimestamps[0]) {

        var totalTimePaused = 0;

        for (const pauseTimestamp of pauseTimestamps) {

            if (pauseTimestamp.timeAtUnpause) {
                timePaused = pauseTimestamp.timeAtUnpause - pauseTimestamp.timeAtPause;
                totalTimePaused += timePaused;
            } else {
                timePaused = currentTime - pauseTimestamp.timeAtPause;
                totalTimePaused += timePaused;
            }
        }

        totalSecondsSincePlay = (currentTime - totalTimePaused - serverQueue.songs[0].timeAtPlay) / 1000;

    } else {

        totalSecondsSincePlay = (currentTime - serverQueue.songs[0].timeAtPlay) / 1000;
    }

    let hoursSincePlay = Math.floor((totalSecondsSincePlay / 60) / 60)
    let minutesSincePlay = Math.floor((totalSecondsSincePlay - (3600 * hoursSincePlay)) / 60)
    let secondsSincePlay = Math.round((totalSecondsSincePlay - (3600 * hoursSincePlay)) - (60 * minutesSincePlay))


    if (hoursSincePlay.toString().length == 1) {
        hoursSincePlay = '0' + hoursSincePlay
    }

    if (minutesSincePlay.toString().length == 1) {
        minutesSincePlay = '0' + minutesSincePlay
    }

    if (secondsSincePlay.toString().length == 1) {
        secondsSincePlay = '0' + secondsSincePlay
    }

    if (hoursSincePlay == '00') {
        timeSincePlay = minutesSincePlay + ':' + secondsSincePlay;
    } else {
        timeSincePlay = hoursSincePlay + ':' + minutesSincePlay + ':' + secondsSincePlay;
    }

    let scrubber = `--------------------------------`

    const fractionPlayed = totalSecondsSincePlay / serverQueue.songs[0].durationSeconds;

    const scrubberIndexToReplace = Math.round(fractionPlayed * scrubber.length);

    scrubber = scrubber.substring(0, scrubberIndexToReplace) + scrubberEmoji + scrubber.substring(scrubberIndexToReplace);
    
    const timeBar = `${timeSincePlay} ${scrubber} ${serverQueue.songs[0].duration}`

    const nowPlayingEmbed = new client.discordjs.MessageEmbed()
        .setTitle(`Ahora Suena`)
        .setDescription(`Loop: ${loopStatus} | Shuffle: ${shuffleStatus}\n\nSolicitado por ${serverQueue.songs[0].requesterUsertag}\n\`\`\`nim\n${serverQueue.songs[0].title}\n\n${timeBar}\n\`\`\``)
        .setColor(65453)
    

    message.channel.send({ embeds: [nowPlayingEmbed]})
}

module.exports.help = {
    name: "playing",
    description: "Ver qué canción está sonando actualmente",
    usage: "Utilizar solamente el comando",
    alias: "np"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}