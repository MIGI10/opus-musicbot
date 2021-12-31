const fetch = require('node-fetch');

module.exports = async (client) => {

    const encodedString = Buffer.from(`${client.config.spotifyClientId}:${client.config.spotifyClientSecret}`).toString('base64');

    const POSToptions = {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encodedString}`
        }
    };

    const res = await fetch('https://accounts.spotify.com/api/token', POSToptions);

    const json = await res.json();

    client.spotifytoken = json.access_token;
}