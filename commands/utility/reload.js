const fs = require('fs');
const { prefix, emotes } = require('../../config.json');

module.exports = {
	name: 'reload',
  alias: [],
  description: `Reloads my revolver in case there was an update!`,
  ownerOnly: true,
  guildOnly: true,
  visible: false,
  usage: {
    args: [{
      display: 'command',
      description: 'the command to be reloaded',
      type: 'text',
      optional: true
    }]
  },
  
	async execute(message, args) {
    // grab every file required
    const commandFolders = fs.readdirSync('./commands');
    let commandFiles = [];
    for (const folder of commandFolders) {
      commandFiles = commandFiles.concat(fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js')));
    }

    let reloadingCommands = (!args[0]) ? commandFiles : [];
    let failedReloading = [];
    
    // return all alias into their default files
    for (let i = 0; i < args.length; i++) {
      const commandName = args[i].toLowerCase();
      const originalCmd = message.client.commands.get(commandName)
			|| message.client.commands.find(cmd => cmd.alias && cmd.alias.includes(commandName));

      if (!originalCmd) {
        failedReloading.push(`${commandName}.js`);
      } else {
        reloadingCommands.push(`${originalCmd.name}.js`);
      }
    }

    // deletes command from cache, the reloads it
    let workingMessage = await message.reply(`${emotes.todd} I'm on it... (0/${reloadingCommands.length} done)`);
    for (let i = 0; i < reloadingCommands.length; i++) {
      const folderName = commandFolders.find(folder => fs.readdirSync(`./commands/${folder}`).includes(`${reloadingCommands[i]}`));

      delete require.cache[require.resolve(`../${folderName}/${reloadingCommands[i]}`)];

      try {
      	const newCommand = require(`../${folderName}/${reloadingCommands[i]}`);
      	message.client.commands.set(newCommand.name, newCommand);
        
      	await workingMessage.edit(`${emotes.todd} \`${newCommand.name}.js\` reloaded (${i+1}/${reloadingCommands.length} done)`);
      } catch (error) {
      	console.error(error);
      	return workingMessage.edit(`${emotes.toddYell} AAH! Revolver stuck! Revolver stuck! Take cover!\`\`\`${error}\`\`\``);
      }
    }

    let failedMessage = (failedReloading.length < 1) ? "" : `\n\n> \`${failedReloading.join("`, `")}\` not found`;
    workingMessage.edit(`${emotes.toddHappy} ${reloadingCommands.length} bullets all reloaded, just like that revolver!${failedMessage}`);
	},
};