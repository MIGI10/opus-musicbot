const youtubeSearch = require('youtube-search-api');

module.exports = async (songName, requesterId, requesterUsertag, position, queue, guild) => {

    const videoList = await youtubeSearch.GetListByKeyword(songName, false);

    let i = 0;
    video = videoList.items[0];

    while (!videoList.items[i] || videoList.items[i].type !== 'video' || videoList.items[i].isLive || !videoList.items[i].length.simpleText) {
        video = videoList.items[i + 1];
        i++;

        if (!video) {

            if (!queue.updating) {
                queue.textChannel.send(strings[guild.language].songNotFound.replace('%SONGNAME%', songName));
            }
            return;
        }
    }

    const length = video.length.simpleText;
    let durationArray = length.split(':');
    durationArray = durationArray.map(Number);

    let totalDurationSeconds = 0;

    if (durationArray.length == 3) {

        let durationHours = durationArray[0];
        let durationMins = durationArray[1];
        let durationSeconds = durationArray[2];

        const hoursToSeconds = durationHours * 3600;
        totalDurationSeconds += hoursToSeconds;

        const minutesToSeconds = durationMins * 60;
        totalDurationSeconds += minutesToSeconds;

        totalDurationSeconds += durationSeconds;

        if (durationHours.toString().length == '1') {
            durationHours = '0' + durationHours
        }
        if (durationMins.toString().length == '1') {
            durationMins = '0' + durationMins
        }  
        if (durationSeconds.toString().length == '1') {
            durationSeconds = '0' + durationSeconds
        }

        duration = durationHours + ':' + durationMins + ':' + durationSeconds;

    } else {

        let durationMins = durationArray[0];
        let durationSeconds = durationArray[1];

        const minutesToSeconds = durationMins * 60;
        totalDurationSeconds += minutesToSeconds;

        totalDurationSeconds += durationSeconds;

        if (durationMins.toString().length == '1') {
            durationMins = '0' + durationMins
        }  
        if (durationSeconds.toString().length == '1') {
            durationSeconds = '0' + durationSeconds
        }

        duration = durationMins + ':' + durationSeconds;
    }

    const song = {
        title: video.title.replaceAll(`||`, `\\||`),
        duration: duration,
        durationSeconds: totalDurationSeconds,
        position: position,
        timeAtPlay: null,
        pauseTimestamps: [],
        url: 'https://www.youtube.com/watch?v=' + video.id,
        requesterId: requesterId,
        requesterUsertag: requesterUsertag
    };

    return queue.songs.push(song);
}