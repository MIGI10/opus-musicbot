const { Interaction } = require("discord.js");

module.exports.run = async (client, message, args) => {

    const MessageActionRow = client.discordjs.MessageActionRow;
    const MessageButton = client.discordjs.MessageButton;

    if (!client.queue.get(message.guild.id) || !client.queue.get(message.guild.id).connection) {
        return message.reply('¡No estoy actualmente en uso!');
    }

    const serverQueue = client.queue.get(message.guild.id);

    if (message.channel !== serverQueue.textChannel) {
        return message.reply(`Estoy actualmente en uso en <#${serverQueue.voiceChannel.id}> y <#${serverQueue.textChannel.id}>, puedes usar \`${client.prefix}transfer\` para cambiar el canal de texto de la sesión`)
    }

    let firstPageButton = new MessageButton()
        .setCustomId('first_page')
        .setLabel('First Page')
        .setStyle('SECONDARY');

    let backPageButton = new MessageButton()
        .setCustomId('back_page')
        .setLabel('Back')
        .setStyle('DANGER');

    let nextPageButton = new MessageButton()
        .setCustomId('next_page')
        .setLabel('Next')
        .setStyle('SUCCESS');

    let lastPageButton = new MessageButton()
        .setCustomId('last_page')
        .setLabel('Last Page')
        .setStyle('SECONDARY');

    let row = new MessageActionRow()
        .addComponents(
            firstPageButton,
            backPageButton,
            nextPageButton,
            lastPageButton
        );

    if (!serverQueue.songs[0]) {

        message.reply('No hay canciones en la cola');

    } else {

        let queueEmbed = await nowPlaying(serverQueue, message);

        const totalPages = Math.ceil((serverQueue.songs.length - 1) / 6)

        if (totalPages === 0) {

            message.channel.send({ embeds: [queueEmbed]});

        } else {

            for (let i = 1; (serverQueue.songs.length - 1) >= i && i <= 6; i++) {
                queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, `Solicitado por ${serverQueue.songs[i].requesterUsertag}`)
            }

            const msg = await message.channel.send({ embeds: [queueEmbed], components: [row]});

            const filter = i => i.member.voice.channel && i.member.voice.channel == serverQueue.voiceChannel;

            const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async int => {

                if (int.customId === 'first_page') {

                    firstPage(int);

                } else if (int.customId === 'last_page') {

                    lastPage(int);

                } else if (int.customId === 'back_page') {

                    const previousFirstSong = parseInt(int.message.embeds[0].fields[1].name.split('.')[0])
                    const firstSongInPage = previousFirstSong - 6;
                    const totalSongs = serverQueue.songs.length - 1;
                    const totalSongsQuotient = totalSongs / 6;

                    if (firstSongInPage > 0) {

                        queueEmbed = await nowPlaying(serverQueue, message);

                        for (let i = firstSongInPage; (firstSongInPage + 5) >= i && totalSongs >= i; i++) {
                            queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, `Solicitado por ${serverQueue.songs[i].requesterUsertag}`)
                        }
        
                        queueEmbed.setFooter(`Página ${Math.ceil(firstSongInPage / 6)} de ${Math.ceil(totalSongsQuotient)}`)
        
                        await int.update({ embeds: [queueEmbed], components: [row] });

                    } else {

                        firstPage(int);
                    }

                } else if (int.customId === 'next_page') {

                    const previousFirstSong = parseInt(int.message.embeds[0].fields[1].name.split('.')[0])
                    const firstSongInPage = previousFirstSong + 6;
                    const totalSongs = serverQueue.songs.length - 1;
                    const totalSongsQuotient = totalSongs / 6;

                    if (firstSongInPage <= totalSongs) {
                        
                        queueEmbed = await nowPlaying(serverQueue, message);

                        for (let i = firstSongInPage; (firstSongInPage + 5) >= i && totalSongs >= i; i++) {
                            queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, `Solicitado por ${serverQueue.songs[i].requesterUsertag}`)
                        }

                        queueEmbed.setFooter(`Página ${Math.ceil(firstSongInPage / 6)} de ${Math.ceil(totalSongsQuotient)}`)

                        await int.update({ embeds: [queueEmbed], components: [row] });

                    } else {

                        lastPage(int);
                    }
                }
            });

            collector.on('end', collected => {

                firstPageButton.setDisabled(true);
                lastPageButton.setDisabled(true);
                backPageButton.setDisabled(true);
                nextPageButton.setDisabled(true);

                row = new MessageActionRow()
                .addComponents(
                    firstPageButton,
                    backPageButton,
                    nextPageButton,
                    lastPageButton
                );

                msg.edit({ components: [row] });
            });
        }
    }

    async function nowPlaying(queue, message) {

        if (queue.loop) {
            loopStatus = '🟢';
        } else {
            loopStatus = '🔴';
        }

        if (queue.shuffle) {
            shuffleStatus = '🟢';
        } else {
            shuffleStatus = '🔴';
        }

        if (!queue.playing) {
            scrubberEmoji = '⏸';
        } else {
            scrubberEmoji = '🔘';
        }

        const currentTime = Date.now();

        const pauseTimestamps = queue.songs[0].pauseTimestamps;
    
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
    
            totalSecondsSincePlay = (currentTime - totalTimePaused - queue.songs[0].timeAtPlay) / 1000;
    
        } else {

            totalSecondsSincePlay = (currentTime - queue.songs[0].timeAtPlay) / 1000;
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
    
        const fractionPlayed = totalSecondsSincePlay / queue.songs[0].durationSeconds;
    
        const scrubberIndexToReplace = Math.round(fractionPlayed * scrubber.length);
    
        scrubber = scrubber.substring(0, scrubberIndexToReplace) + scrubberEmoji + scrubber.substring(scrubberIndexToReplace);
        
        const timeBar = `${timeSincePlay} ${scrubber} ${queue.songs[0].duration}`

        const totalPages = Math.ceil((queue.songs.length - 1) / 6)?
            Math.ceil((queue.songs.length - 1) / 6):
            1;

        const queueEmbed = new client.discordjs.MessageEmbed()
            .setTitle(`Cola de ${message.guild.name}`)
            .setDescription(`Loop: ${loopStatus} | Shuffle: ${shuffleStatus}`)
            .addField('**Ahora Suena:**', `Solicitado por ${queue.songs[0].requesterUsertag}\n\`\`\`nim\n${queue.songs[0].title}\n\n${timeBar}\n\`\`\``)
            .setColor(65453)
            .setFooter(`Página 1 de ${totalPages}`)

        return queueEmbed;
    }

    async function firstPage(int) {

        queueEmbed = await nowPlaying(serverQueue, message);

        const totalSongs = serverQueue.songs.length - 1;
        const totalSongsQuotient = totalSongs / 6;

        for (let i = 1; totalSongs >= i && i <= 6; i++) {
            queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, `Solicitado por ${serverQueue.songs[i].requesterUsertag}`)
        }

        queueEmbed.setFooter(`Página 1 de ${Math.ceil(totalSongsQuotient)}`)

        return await int.update({ embeds: [queueEmbed], components: [row] });
    }

    async function lastPage(int) {

        if (serverQueue.updating) {
            int.reply('La cola está siendo actualizada, espere a que finalice para ver la última página correctamente');
            return setTimeout(() => { 
                int.deleteReply(); 
            }, 5000)
        }

        queueEmbed = await nowPlaying(serverQueue, message);

        const totalSongs = serverQueue.songs.length - 1;
        const totalSongsQuotient = totalSongs / 6;
        const firstSongInPage = (6 * Math.ceil(totalSongsQuotient - 1)) + 1;

        for (let i = firstSongInPage; totalSongs >= i; i++) {
            queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, `Solicitado por ${serverQueue.songs[i].requesterUsertag}`)
        }

        queueEmbed.setFooter(`Página ${Math.ceil(totalSongsQuotient)} de ${Math.ceil(totalSongsQuotient)}`)

        return await int.update({ embeds: [queueEmbed], components: [row] });
    }
}

module.exports.help = {
    name: "queue",
    description: "Ver la cola de música del servidor y la canción que suena actualmente",
    usage: "Utilizar solamente el comando",
    alias: "q"
}

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false
}