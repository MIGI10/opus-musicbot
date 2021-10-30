const Discord = require('discord.js');
const voice = require('@discordjs/voice');
const db = require("mongoose");
const Genius = require("genius-lyrics");

const config = require('./config.json');

const client = new Discord.Client({ intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES
], partials: ["CHANNEL"]
});

const geniusClient = new Genius.Client(config.geniusToken);

client.prefix = config.prefix;
client.config = config;
client.db = db;
client.commands = new Discord.Collection();
client.cmdaliases = new Discord.Collection();
client.discordjs = Discord;
client.discordjsvoice = voice;
client.geniusapi = geniusClient;

const queue = new Map();
client.queue = queue;

const commands = require("./structures/command");
commands.run(client);

const events = require("./structures/event");
events.run(client);

function dbConnect() {
    db.connect(`mongodb://${config.mongoIP}:${config.mongoPort}/${config.mongoDatabase}`, { useNewUrlParser: true, useUnifiedTopology: true })
};

setTimeout(dbConnect, 5000);

const guildSchema = new db.Schema({
    id: String,
    name: String,
    memberCount: Number,
    ownerId: String,
    ownerTag: String,
    modRoleId: String,
    joinedAt: Date,
    createdAt: Date,
    isPartnered: Boolean,
    isVerified: Boolean,
    boostCount: Number,
    description: String
});

const guild = db.model("guild", guildSchema);

db.guild = guild;

process.on('unhandledRejection', error => {
	console.error('[EVENT] Unhandled promise rejection:', error);
});

client.on('warn', (warn) => console.warn('[EVENT - WARN]' + warn));
client.on('error', (error) => console.error('[EVENT - ERROR]' + error));
client.on('invalidated', () => console.fatal('[EVENT] Session invalidated!'));
client.on('rateLimit', (info) => console.warn(`[EVENT] Ratelimit hit, ${info.timeout}ms delay`));

client.login(config.botToken);