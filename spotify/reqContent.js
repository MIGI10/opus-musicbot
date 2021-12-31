const fetch = require('node-fetch');
const reqAuth = require('./reqAuthorization');

module.exports = async (client, message, args, guild) => {

    if (args[1] && !isNaN(args[1])) {
        var offset = parseInt(args[1]);
    } else {
        var offset = 0;
    }

    args = args.join(' ');
    const urlArray = args.split('/');

    let songs = [];

    if (urlArray.includes('playlist')) {

        const IdIndex = urlArray.indexOf('playlist') + 1;
        const spotifyId = urlArray[IdIndex].split('?')[0];

        var query = await getPlaylist(spotifyId);

        if (query == 'private') {
            return message.reply(strings[guild.language].playlistPrivate);
        }

        if (query == 'not found') {
            return message.reply(strings[guild.language].playlistNotFound);
        }

        if (offset > query.tracks.total) {
            return message.reply(strings[guild.language].playlistInvalidOffset);
        }

        if (offset) {

            query.tracks.items = query.tracks.items.slice(offset - 1);
            query.tracks.total -= offset - 1; 
        }

        if (args.includes('reverse')) {

            if (offset) {
                message.channel.send(strings[guild.language].playlistOffsetReverse.replace('%OFFSET%', offset));
            } else {
                message.channel.send(strings[guild.language].playlistReverse);
            }

            for (let i = query.tracks.items.length - 1; i >= 0; i--) {
                if (query.tracks.items[i].track) {
                    const songName = query.tracks.items[i].track.name + ' ' + query.tracks.items[i].track.artists[0].name;
                    songs.push(songName);
                }
            }
                
        } else {

            if (offset) {
                message.channel.send(strings[guild.language].playlistOffset.replace('%OFFSET%', offset));
            }

            for (const item of query.tracks.items) {
                if (item.track) {
                    const songName = item.track.name + ' ' + item.track.artists[0].name;
                    songs.push(songName);
                }
            }
        }

        songs.total = query.tracks.total;
        songs.type = 'playlist';
        songs.offset = offset;
        songs.contentName = query.name;
        songs.contentIcon = query.images[0].url;

        return songs;

    } else if (urlArray.includes('track')) {

        const IdIndex = urlArray.indexOf('track') + 1;
        const spotifyId = urlArray[IdIndex].split('?')[0];

        var query = await getTrack(spotifyId);

        if (query == 'not found') {
            return message.reply(strings[guild.language].playlistNotFound);
        }

        const songName = query.name + ' ' + query.artists[0].name;
        songs.push(songName);

        songs.type = 'track';

        return songs;

    } else if (urlArray.includes('album')) {

        const IdIndex = urlArray.indexOf('album') + 1;
        const spotifyId = urlArray[IdIndex].split('?')[0];

        var query = await getAlbum(spotifyId);

        if (query == 'not found') {
            return message.reply(strings[guild.language].playlistNotFound);
        }

        if (offset > query.tracks.total) {
            return message.reply(strings[guild.language].playlistInvalidOffset);
        }

        if (offset) {

            query.tracks.items = query.tracks.items.slice(offset - 1);
            query.tracks.total -= offset - 1; 
        }

        if (args.includes('reverse')) {

            if (offset) {
                message.channel.send(strings[guild.language].playlistOffsetReverse.replace('%OFFSET%', offset));
            } else {
                message.channel.send(strings[guild.language].playlistReverse)
            }

            for (let i = query.tracks.items.length - 1; i >= 0; i--) {
                if (query.tracks.items[i]) {
                    const songName = query.tracks.items[i].name + ' ' + query.tracks.items[i].artists[0].name;
                    songs.push(songName);
                }
            }
                
        } else {

            if (offset) {
                message.channel.send(strings[guild.language].playlistOffset.replace('%OFFSET%', offset))
            }

            for (const item of query.tracks.items) {
                if (item) {
                    const songName = item.name + ' ' + item.artists[0].name;
                    songs.push(songName);
                }
            }
        }

        songs.total = query.tracks.total;
        songs.type = 'album';
        songs.offset = offset;
        songs.contentName = query.name;
        songs.contentIcon = query.images[0].url;

        return songs;

    } else if (urlArray.includes('artist')) {

        const IdIndex = urlArray.indexOf('artist') + 1;
        const spotifyId = urlArray[IdIndex].split('?')[0];

        var query = await getArtist(spotifyId);
    
        if (query == 'not found') {
            return message.reply(strings[guild.language].spotifyNotFound);
        }

        for (const track of query.tracks) {
            if (track) {
                const songName = track.name + ' ' + track.artists[0].name;
                songs.push(songName);
            }
        }

        songs.total = query.tracks.length;
        songs.type = 'artist';
        songs.contentName = query.name;
        songs.contentIcon = query.imageUrl;

        return songs;

    } else if (urlArray.includes('episode') || urlArray.includes('show')) {

        message.channel.send(strings[guild.language].podcastsNotCompatible);
        songs.type = null;

        return songs;

    } else {

        throw new Error('Invalid or unrecognized Spotify Link');
    }

    async function getPlaylist(spotifyId) {

        let parameters = 'fields=name,images.url,tracks.next,tracks.total,tracks.items(track(name%2Cartists(name)))'

        var response = await fetch(`https://api.spotify.com/v1/playlists/${spotifyId}?${parameters}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.spotifytoken}`
            }
        })
    
        if (response.status == 401) {

            await reqAuth(client);
            
            response = await fetch(`https://api.spotify.com/v1/playlists/${spotifyId}?${parameters}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${client.spotifytoken}`
                }
            })
        }

        if (response.status == 403) {
            return 'private';
        }

        if (response.status == 404) {
            return 'not found';
        }

        response = await response.json();

        if (response.tracks.next) {

            do {

                if (query && query.next) {
                    nextItemsUrl = query.next;
                }
                else {
                    nextItemsUrl = response.tracks.next;
                }

                query = await fetch(nextItemsUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${client.spotifytoken}`
                    }
                })
    
                query = await query.json();
                
                response.tracks.items = response.tracks.items.concat(query.items);

            } while (query.next);
        }

        return response;
    }

    async function getTrack(spotifyId) {

        var response = await fetch(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.spotifytoken}`
            }
        })

        if (response.status == 401) {

            await reqAuth(client);
            
            response = await fetch(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${client.spotifytoken}`
                }
            })
        }

        if (response.status == 404) {
            return 'not found';
        }

        response = await response.json();

        return response;
    }

    async function getAlbum(spotifyId) {

        var response = await fetch(`https://api.spotify.com/v1/albums/${spotifyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.spotifytoken}`
            }
        })

        if (response.status == 401) {

            await reqAuth(client);
            
            response = await fetch(`https://api.spotify.com/v1/albums/${spotifyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${client.spotifytoken}`
                }
            })
        }

        if (response.status == 404) {
            return 'not found';
        }

        response = await response.json();

        if (response.tracks.next) {

            do {

                if (query && query.next) {
                    nextItemsUrl = query.next;
                }
                else {
                    nextItemsUrl = response.tracks.next;
                }

                query = await fetch(nextItemsUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${client.spotifytoken}`
                    }
                })
    
                query = await query.json();
                
                response.tracks.items = response.tracks.items.concat(query.items);

            } while (query.next);
        }

        return response;
    }

    async function getArtist(spotifyId) {

        var response = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}/top-tracks?market=ES`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.spotifytoken}`
            }
        })

        if (response.status == 401) {

            await reqAuth(client);
            
            response = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}/top-tracks?market=ES`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${client.spotifytoken}`
                }
            })
        }

        if (response.status == 404) {
            return 'not found';
        }

        response = await response.json();

        let additionalInfo = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${client.spotifytoken}`
            }
        })

        additionalInfo = await additionalInfo.json();

        response.name = additionalInfo.name;
        response.imageUrl = additionalInfo.images[0].url;

        return response;
    }
}