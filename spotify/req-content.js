const fetch = require('node-fetch');
const reqAuth = require('./req-authorization');

module.exports.run = async (client, message, args, guild) => {

    if (args[1] && !isNaN(args[1])) {
        var offset = parseInt(args[1]);
    } else {
        var offset = 0;
    }

    args = args.join(' ');

    const urlArray = args.split('/');

    let songs = []

    if (urlArray[3] == 'playlist' && urlArray[4]) {
         
        const spotifyId = urlArray[4].split('?')[0];

        var response = await getPlaylist(spotifyId);
        var query = await response.json();
    
        if (response.status == 401) {

            await reqAuth.run(client);
            response = await getPlaylist(spotifyId);
            query = await response.json();
        }

        if (response.status == 403) {
            return message.reply(strings[guild.language].playlistPrivate)
        }

        if (response.status == 404) {
            return message.reply(strings[guild.language].playlistNotFound);
        }

        if (offset > query.total) {
            return message.reply(strings[guild.language].playlistInvalidOffset);
        }

        if (args.includes('reverse')) {

            if (offset) {
                message.channel.send(strings[guild.language].playlistOffsetReverse.replace('%OFFSET%', offset));
            } else {
                message.channel.send(strings[guild.language].playlistReverse)
            }

            for (let i = query.items.length - 1; i >= 0; i--) {
                if (query.items[i].track) {
                    const songName = query.items[i].track.name + ' ' + query.items[i].track.artists[0].name;
                    songs.push(songName);
                }
            }
                
        } else {

            if (offset) {
                message.channel.send(strings[guild.language].playlistOffset.replace('%OFFSET%', offset));
            }

            for (const item of query.items) {
                if (item.track) {
                    const songName = item.track.name + ' ' + item.track.artists[0].name;
                    songs.push(songName);
                }
            }
        }

        songs.total = query.total;
        songs.type = 'playlist';
        songs.offset = offset;


        return songs;

    } else if (urlArray[3] == 'track' && urlArray[4]) {

        const spotifyId = urlArray[4].split('?')[0];

        var response = await getTrack(spotifyId);
        var query = await response.json();
    
        if (response.status == 401) {

            await reqAuth.run(client);
            response = await getTrack(spotifyId);
            query = await response.json();
        }

        if (response.status == 404) {
            return message.reply(strings[guild.language].spotifyNotFound);
        }

        const songName = query.name + ' ' + query.artists[0].name;
        songs.push(songName);

        songs.type = 'track';

        return songs;

    } else if (urlArray[3] == 'album' && urlArray[4]) {

        const spotifyId = urlArray[4].split('?')[0];

        var response = await getAlbum(spotifyId);
        var query = await response.json();
    
        if (response.status == 401) {

            await reqAuth.run(client);
            response = await getAlbum(spotifyId);
            query = await response.json();
        }

        if (response.status == 404) {
            return message.reply(strings[guild.language].spotifyNotFound);
        }

        if (offset > query.total) {
            return message.reply(strings[guild.language].playlistInvalidOffset);
        }

        if (args.includes('reverse')) {

            if (offset) {
                message.channel.send(strings[guild.language].playlistOffsetReverse.replace('%OFFSET%', offset));
            } else {
                message.channel.send(strings[guild.language].playlistReverse)
            }

            for (let i = query.items.length - 1; i >= 0; i--) {
                if (query.items[i]) {
                    const songName = query.items[i].name + ' ' + query.items[i].artists[0].name;
                    songs.push(songName);
                }
            }
                
        } else {

            if (offset) {
                message.channel.send(strings[guild.language].playlistOffset.replace('%OFFSET%', offset))
            }

            for (const item of query.items) {
                if (item) {
                    const songName = item.name + ' ' + item.artists[0].name;
                    songs.push(songName);
                }
            }
        }

        songs.total = query.total;
        songs.type = 'album';
        songs.offset = offset;

        return songs;

    } else if (urlArray[3] == 'episode' || urlArray[3] == 'show') {

        message.channel.send(strings[guild.language].podcastsNotCompatible);
        songs.type = null;

        return songs;
    }

    async function getPlaylist(spotifyId) {

        if (offset) {
            parameters = `fields=total,items(track(name%2Cartists(name)))&offset=${offset}`
        } else {
            parameters = 'fields=total,items(track(name%2Cartists(name)))'
        }

        const response = await fetch(`https://api.spotify.com/v1/playlists/${spotifyId}/tracks?${parameters}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.spotifytoken}`
            }
        })

        return response;
    }

    async function getTrack(spotifyId) {

        const response = await fetch(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.spotifytoken}`
            }
        })

        return response;
    }

    async function getAlbum(spotifyId) {

        if (offset) {
            parameters = `limit=50&offset=${offset}`
        } else {
            parameters = 'limit=50'
        }

        const response = await fetch(`https://api.spotify.com/v1/albums/${spotifyId}/tracks?${parameters}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.spotifytoken}`
            }
        })

        return response;
    }
}