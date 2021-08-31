const { readdirSync } = require('fs');
const { join } = require('path');
const filePath = join(__dirname, "..", "commands");

module.exports.run = (client) => {
    for (const cmd of readdirSync(filePath).filter(cmd => cmd.endsWith(".js"))) {
        const command = require(`${filePath}/${cmd}`);
        client.commands.set(command.help.name, command);
        if (command.help.alias) {
            client.cmdaliases.set(command.help.alias, command);
        }
    }
    console.log(`Loaded ${client.commands.size} commands and ${client.cmdaliases.size} aliases!`);
}