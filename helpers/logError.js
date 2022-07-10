const fs = require("fs");
const path = require('path');
const util = require('util');

module.exports = (error, internalCode, interaction, guild, queue) => {

    let errorCode = `${internalCode}-${Math.floor(Math.random()*1000)}`;
    const errorHeader = `--------- Internal error ${errorCode} ---------`;
    const date = new Date().toLocaleString('es-ES');
    console.log(date)
    console.log(errorHeader);
    console.error(error);

    const directory = path.join(
        __dirname,
        "..",
        "logs",
        `${new Date().getFullYear()}`,
        `${new Date().getMonth() + 1}`,
        `${new Date().getDate()}`,
        ""
    );

    if (!fs.existsSync(directory)){
        fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(
        `${directory}/${errorCode}_${date.slice(-8).replace(/ /g,'')}.log`,
        `${errorHeader}\n${date}\n\n${util.inspect(error)}\n\nInteraction: ${interaction}\n\n${guild}\n\n${util.inspect(queue)}`
    )

    return errorCode;
}