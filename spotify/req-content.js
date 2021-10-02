const fetch = require('node-fetch');
const reqAuth = require('./req-authorization');

module.exports.run = async (client, message, args) => {

    const urlArray = args[0].split('/');

    if (args[1] || args[2]) {
        argsGiven = true;
    } else {
        argsGiven = false;
    }

    if (urlArray[3] == 'playlist' && urlArray[4]) {
         
        const spotifyId = urlArray[4].split('?')[0];

        let songs = []

        var response = await getPlaylist(spotifyId, args);
        var query = await response.json();
    
        if (response.status == 401) {

            await reqAuth.run(client);
            response = await getPlaylist(spotifyId, args);
            query = await response.json();
        }

        if (response.status == 403) {
            return message.reply('¡Esa playlist no se puede cargar por ser privada!')
        }

        if (argsGiven && args[1] == 'reverse' || args[2] == 'reverse') {

            if (!isNaN(args[1])) {
                message.channel.send(`Se ha solicitado que se empiece por la canción ${args[1]} y que posteriormente se añadan de forma invertida`);
            } else {
                message.channel.send(`Se ha solicitado que las canciones se añadan de forma invertida`)
            }

            for (let i = query.items.length - 1; i >= 0; i--) {
                const songName = query.items[i].track.name + ' ' + query.items[i].track.artists[0].name;
                songs.push(songName);
            }
                
        } else {

            if (!isNaN(args[1])) {
                message.channel.send(`Se ha solicitado que se empiece por la canción ${args[1]}`)
            }

            for (const item of query.items) {
                const songName = item.track.name + ' ' + item.track.artists[0].name;
                songs.push(songName);
            }
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

        var response = await getAlbum(spotifyId, args);
        var query = await response.json();
    
        if (response.status == 401) {

            await reqAuth.run(client);
            response = await getAlbum(spotifyId, args);
            query = await response.json();
        }

        if (argsGiven && args[1] == 'reverse' || args[2] == 'reverse') {

            if (!isNaN(args[1])) {
                message.channel.send(`Se ha solicitado que se empiece por la canción ${args[1]} y que posteriormente se añadan de forma invertida`);
            } else {
                message.channel.send(`Se ha solicitado que las canciones se añadan de forma invertida`)
            }

            for (let i = query.items.length - 1; i >= 0; i--) {
                const songName = query.items[i].name + ' ' + query.items[i].artists[0].name;
                songs.push(songName);
            }
                
        } else {

            if (!isNaN(args[1])) {
                message.channel.send(`Se ha solicitado que se empiece por la canción ${args[1]}`)
            }

            for (const item of query.items) {
                const songName = item.name + ' ' + item.artists[0].name;
                songs.push(songName);
            }
        }

        songs.total = query.total;
        songs.type = 'album';

        return songs;
    }

    async function getPlaylist(spotifyId, args) {

        if (args[1] && !isNaN(args[1])) {
            const offset = parseInt(args[1]);
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

    async function getAlbum(spotifyId, args) {

        if (args[1] && !isNaN(args[1])) {
            const offset = parseInt(args[1]);
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