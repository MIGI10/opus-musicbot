const { readdirSync } = require('fs');
const { join } = require('path');
const filePath = join(__dirname, "..", "commands");

module.exports.run = (client) => {

    for (const cmd of readdirSync(filePath).filter(cmd => cmd.endsWith(".js"))) {

        const commandPath = `${filePath}/${cmd}`;
        delete require.cache[commandPath];
        const command = require(commandPath);

        const cmdName = cmd.split('.')[0];
        client.commands.set(cmdName, command);
    }
    console.log(`Loaded ${client.commands.size} commands!`);
}