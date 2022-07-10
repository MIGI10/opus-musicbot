module.exports.run = async (client, interaction, guild) => {

    const MessageActionRow = client.discordjs.MessageActionRow;
    const MessageButton = client.discordjs.MessageButton;

    if (!client.queue.get(interaction.guildId) || !client.queue.get(interaction.guildId).connection) {
        return interaction.reply(strings[guild.language].botNotInUse);
    }

    const serverQueue = client.queue.get(interaction.guildId);

    if (interaction.channel !== serverQueue.textChannel) {
        return interaction.reply(strings[guild.language].botOccupied.replace('%VOICECHANNELID%', serverQueue.voiceChannel.id).replace('%TEXTCHANNELID%', serverQueue.textChannel.id));
    }

    if (serverQueue.updating) {
        return interaction.reply(strings[guild.language].botIsUpdating2)
            .then(setTimeout(() => { 
                interaction.deleteReply()
                .catch((err) => null);
            }, 5000))
    }

    let firstPageButton = new MessageButton()
        .setCustomId('first_page')
        .setEmoji('⏮')
        .setStyle('SECONDARY');

    let backPageButton = new MessageButton()
        .setCustomId('back_page')
        .setEmoji('◀️')
        .setStyle('SECONDARY');

    let nextPageButton = new MessageButton()
        .setCustomId('next_page')
        .setEmoji('▶️')
        .setStyle('SECONDARY');

    let lastPageButton = new MessageButton()
        .setCustomId('last_page')
        .setEmoji('⏭')
        .setStyle('SECONDARY');

    let row = new MessageActionRow()
        .addComponents(
            firstPageButton,
            backPageButton,
            nextPageButton,
            lastPageButton
        );

    if (!serverQueue.songs[0]) {

        interaction.reply(strings[guild.language].botNoQueuedSongs);

    } else {

        let queueEmbed = nowPlaying(serverQueue, interaction);

        const totalPages = Math.ceil((serverQueue.songs.length - 1) / 6);

        queueEmbed.setFooter({ text: queueEmbed.footer.text.replace('%PAGENUM%', 1).replace('%TOTALPAGECOUNT%', totalPages != 0 ? totalPages : 1)});

        if (totalPages === 0) {

            interaction.reply({ embeds: [queueEmbed]});

        } else {

            for (let i = 1; (serverQueue.songs.length - 1) >= i && i <= 6; i++) {
                queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, strings[guild.language].songRequestedBy.replace('%REQUESTER%', serverQueue.songs[i].requesterUsertag))
            }

            interaction.reply({ embeds: [queueEmbed], components: [row]});
            const msg = await interaction.fetchReply();

            const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async int => {

                if (msg.id != int.message.id) return;

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

                        queueEmbed = await nowPlaying(serverQueue, interaction);

                        for (let i = firstSongInPage; (firstSongInPage + 5) >= i && totalSongs >= i; i++) {
                            queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, strings[guild.language].songRequestedBy.replace('%REQUESTER%', serverQueue.songs[i].requesterUsertag))
                        }
        
                        queueEmbed.setFooter({ text: queueEmbed.footer.text.replace('%PAGENUM%', Math.ceil(firstSongInPage / 6)).replace('%TOTALPAGECOUNT%', Math.ceil(totalSongsQuotient))})
        
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
                        
                        queueEmbed = await nowPlaying(serverQueue, interaction);

                        for (let i = firstSongInPage; (firstSongInPage + 5) >= i && totalSongs >= i; i++) {
                            queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, strings[guild.language].songRequestedBy.replace('%REQUESTER%', serverQueue.songs[i].requesterUsertag))
                        }

                        queueEmbed.setFooter({ text: queueEmbed.footer.text.replace('%PAGENUM%', Math.ceil(firstSongInPage / 6)).replace('%TOTALPAGECOUNT%', Math.ceil(totalSongsQuotient))})

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

                interaction.editReply({ components: [row] });
            });
        }
    }

    function formatTime(totalSeconds) {

        let hoursUnit = Math.floor(totalSeconds / 3600);
        let minutesUnit = Math.floor((totalSeconds % 3600) / 60);
        let secondsUnit = Math.round((totalSeconds % 3600) % 60);
    
        if (hoursUnit.toString().length == 1) {
            hoursUnit = '0' + hoursUnit;
        }
    
        if (minutesUnit.toString().length == 1) {
            minutesUnit = '0' + minutesUnit;
        }
    
        if (secondsUnit.toString().length == 1) {
            secondsUnit = '0' + secondsUnit;
        }
    
        if (hoursUnit == '00') {
            formattedTime = minutesUnit + ':' + secondsUnit;
        } else {
            formattedTime = hoursUnit + ':' + minutesUnit + ':' + secondsUnit;
        }

        return formattedTime;
    }

    function nowPlaying(queue, interaction) {

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
    
        const timeSincePlay = formatTime(totalSecondsSincePlay);
    
        let scrubber = `--------------------------------`;
    
        const fractionPlayed = totalSecondsSincePlay / queue.songs[0].durationSeconds;
    
        const scrubberIndexToReplace = Math.round(fractionPlayed * scrubber.length);
    
        scrubber = scrubber.substring(0, scrubberIndexToReplace) + scrubberEmoji + scrubber.substring(scrubberIndexToReplace);
        
        const timeBar = `${timeSincePlay} ${scrubber} ${queue.songs[0].duration}`

        let queueLengthSeconds = 0;
        
        for (const song of queue.songs) {
            queueLengthSeconds += song.durationSeconds;
        }

        const queueLength = formatTime(queueLengthSeconds);

        const queueEmbed = new client.discordjs.MessageEmbed()
            .setTitle(strings[guild.language].queueName.replace('%NAME%', interaction.guild.name))
            .setDescription(`Loop: ${loopStatus} | Shuffle: ${shuffleStatus}`)
            .addField(`**${strings[guild.language].songNowPlaying}:**`, `${strings[guild.language].songRequestedBy.replace('%REQUESTER%', serverQueue.songs[0].requesterUsertag)}\n\`\`\`nim\n${queue.songs[0].title.replaceAll(`\\||`, `||`)}\n\n${timeBar}\n\`\`\``)
            .setColor(65453)
            .setFooter({ text: `${strings[guild.language].pageNumber} ∙ ${strings[guild.language].queueLength.replace('%LENGTH%', queueLength)}`})

        return queueEmbed;
    }

    function firstPage(int) {

        queueEmbed = nowPlaying(serverQueue, interaction);

        const totalSongs = serverQueue.songs.length - 1;
        const totalSongsQuotient = totalSongs / 6;

        for (let i = 1; totalSongs >= i && i <= 6; i++) {
            queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, strings[guild.language].songRequestedBy.replace('%REQUESTER%', serverQueue.songs[i].requesterUsertag))
        }

        queueEmbed.setFooter({ text: queueEmbed.footer.text.replace('%PAGENUM%', 1).replace('%TOTALPAGECOUNT%', Math.ceil(totalSongsQuotient))})

        return int.update({ embeds: [queueEmbed], components: [row] });
    }

    function lastPage(int) {

        queueEmbed = nowPlaying(serverQueue, interaction);

        const totalSongs = serverQueue.songs.length - 1;
        const totalSongsQuotient = totalSongs / 6;
        const firstSongInPage = (6 * Math.ceil(totalSongsQuotient - 1)) + 1;

        for (let i = firstSongInPage; totalSongs >= i; i++) {
            queueEmbed.addField(`${i}. ${serverQueue.songs[i].title} [${serverQueue.songs[i].duration}]`, strings[guild.language].songRequestedBy.replace('%REQUESTER%', serverQueue.songs[i].requesterUsertag))
        }

        queueEmbed.setFooter({ text: queueEmbed.footer.text.replace('%PAGENUM%', Math.ceil(totalSongsQuotient)).replace('%TOTALPAGECOUNT%', Math.ceil(totalSongsQuotient))})

        return int.update({ embeds: [queueEmbed], components: [row] });
    }
}

module.exports.data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription(strings['eng'].queueHelpDescription)

module.exports.requirements = {
    userPerms: [],
    clientPerms: [],
    modOnly: false,
    devOnly: false
}