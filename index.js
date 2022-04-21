const Discord = require('discord.js');
const voice = require('@discordjs/voice');
const db = require("mongoose");
const Genius = require("genius-lyrics");
const { DynamicPool, StaticPool } = require('node-worker-threads-pool'); 
const path = require('path');
const Piscina = require('piscina');

const piscina = new Piscina({
  filename: path.resolve(__dirname, './lib/test.js')
});

const threadPool = new StaticPool({
  size: 4,
  task: path.resolve(__dirname, './lib/test.js'),
  workerData: 'workerData!'
});

const config = require('./config.json');

const client = new Discord.Client({ intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES
], partials: ["CHANNEL"]
});

const geniusClient = new Genius.Client(config.geniusToken);

//const threadPool = new DynamicPool(8);

const engStrings = require('./lang/eng.json');
const spaStrings = require('./lang/spa.json');

strings = {};

strings['eng'] = engStrings;
strings['spa'] = spaStrings;

global.strings = strings;

const logError = require('./helpers/logError');
global.logError = logError;

client.prefix = config.prefix;
client.config = config;
client.db = db;
client.commands = new Discord.Collection();
client.cmdaliases = new Discord.Collection();
client.discordjs = Discord;
client.discordjsvoice = voice;
client.geniusapi = geniusClient;
client.threadPool = threadPool;
client.piscina = piscina;

const queue = new Map();
client.queue = queue;

const commands = require("./loaders/command");
commands.run(client);

const events = require("./loaders/event");
events.run(client);

function dbConnect() {
    db.connect(`mongodb://${config.mongoIP}:${config.mongoPort}/${config.mongoDatabase}`, { useNewUrlParser: true, useUnifiedTopology: true })
};

setTimeout(dbConnect, 5000);

const guildSchema = new db.Schema({
    id: String,
    name: String,
    language: String,
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

process.on('unhandledRejection', (reason, promise) => {
	console.error('[EVENT] Unhandled promise rejection at:', promise, 'Reason:', reason);
});

process.on('uncaughtException', (error, origin) => {
	console.error('[EVENT] Uncaught exception at:', origin, 'Error:', error);
});

client.on('warn', (warn) => console.warn('[EVENT - WARN]' + warn));
client.on('error', (error) => console.error('[EVENT - ERROR]' + error));
client.on('invalidated', () => console.fatal('[EVENT] Session invalidated!'));
client.on('rateLimit', (info) => console.warn(`[EVENT] Ratelimit hit, ${info.timeout}ms delay\n${JSON.stringify(info)}`));

client.login(config.botToken);