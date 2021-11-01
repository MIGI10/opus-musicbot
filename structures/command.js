const { readdirSync } = require('fs');
const { join } = require('path');
const filePath = join(__dirname, "..", "commands");

module.exports.run = (client) => {

    for (const cmd of readdirSync(filePath).filter(cmd => cmd.endsWith(".js"))) {

        const commandPath = `${filePath}/${cmd}`;
        delete require.cache[commandPath];
        const command = require(commandPath);

        client.commands.set(command.info.name, command);
        if (command.info.alias) {
            client.cmdaliases.set(command.info.alias, command);
        }
    }
    console.log(`Loaded ${client.commands.size} commands and ${client.cmdaliases.size} aliases!`);
}