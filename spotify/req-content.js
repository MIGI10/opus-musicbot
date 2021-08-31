const fetch = require('node-fetch');
const reqAuth = require('./req-authorization');

module.exports.run = async (client, message, args) => {

    const urlArray = args[0].split('/')

    if (urlArray[3] == 'playlist' && urlArray[4]) {
         
        const spotifyId = urlArray[4].split('?')[0];

        let songs = []

        var response = await getPlaylist(spotifyId);
        var query = await response.json();
    
        if (response.status == 401) {

            await reqAuth.run(client);
            response = await getPlaylist(spotifyId);
            query = await response.json();
        }

        for (const item of query.items) {

            const songName = item.track.name + ' ' + item.track.artists[0].name;
            songs.push(songName);
        }

        songs.total = query.total;
        songs.type = 'playlist';

        return songs;

    } else if (urlArray[3] == 'track' && urlArray[4]) {

        const spotifyId = urlArray[4].split('?')[0];

        let songs = []

        var response = await getTrack(spotifyId);
        var query = await response.json();
    
        if (response.status == 401) {

            await reqAuth.run(client);
            response = await getTrack(spotifyId);
            query = await response.json();
        }

        const songName = query.name + ' ' + query.artists[0].name;
        songs.push(songName);

        songs.type = 'track';

        return songs;

    } else if (urlArray[3] == 'album' && urlArray[4]) {

        const spotifyId = urlArray[4].split('?')[0];

        let songs = []

        var response = await getAlbum(spotifyId);
        var query = await response.json();
    
        if (response.status == 401) {

            await reqAuth.run(client);
            response = await getAlbum(spotifyId);
            query = await response.json();
        }

        for (const item of query.items) {

            const songName = item.name + ' ' + item.artists[0].name;
            songs.push(songName);
        }

        songs.total = query.total;
        songs.type = 'album';

        return songs;
    }

    async function getPlaylist(spotifyId) {

        const response = await fetch(`https://api.spotify.com/v1/playlists/${spotifyId}/tracks?fields=total,items(track(name%2Cartists(name)))`, {
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

        const response = await fetch(`https://api.spotify.com/v1/albums/${spotifyId}/tracks?limit=50`, {
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