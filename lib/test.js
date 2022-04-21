const queueSong = require('./queueSong');

module.exports = async ({ songs, queue, message, guild }) => {

    let i = 1;

    for (const song of songs) {

        if (typeof song === 'string') {
        
            if (i == 1) {
                await queueSong(song, message.author.id, message.author.tag, i, queue, guild)
                    .catch(err => {
                        logError(err, '12', message, guild, queue);
                    });
            } else {
                queueSong(song, message.author.id, message.author.tag, i, queue, guild)
                    .catch(err => {
                        logError(err, '12', message, guild, queue);
                    });
            }

            if (i == songs.length) {

            
            }

            i++
        }

    }

    if (songs.length <= 100) {
        waitTime = 7000;
    }
    else if (songs.length <= 200) {
        waitTime = 10000;
    }
    else {
        waitTime = (songs.length / 20) * 1000;
    }

    setTimeout(async () => {

        const sorted = queue.songs.filter(song => song.position).sort((a, b) => {
            return a.position - b.position;
        })
        
        let firstSong = queue.songs.indexOf(queue.songs.find(element => element.position)) + 1;
        let lastSong = queue.songs.indexOf(queue.songs.filter(element => element.position).pop()) + 1;

        for await (const sortedSong of sorted) {
            sortedSong.position = null;
        }

        queue.songs.splice(firstSong, lastSong - firstSong);

        for (let i = firstSong, j = 1; i < lastSong; i++, j++) {
            queue.songs.splice(i, 0, sorted[j]);
        }

        return queue;

    }, waitTime);
}