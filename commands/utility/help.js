const { prefix, emotes } = require('../../config.json');
const discUtils = require('../../utils/disc.js');

module.exports = {
  name: 'help',
  alias: ['command', 'commands'],
  description: `Displays info on commands!`,
  usage: {
    args: [{
      display: 'command',
      description: 'the command to display help for',
      type: 'text',
      optional: true
    }]
  },

  async execute(message, args) {
    const data = [];
    const { commands } = message.client;

    // if no commands
    if (!args.length) {
      data.push(`${emotes.toddHappy} Here're all of my commands! Additional help for a specific command can be requested using \`${prefix}help [command]\`:`);
      
      const visibleCommands = commands.filter(command => command.visible !== false && command.helper !== true);
      data.push(`\`\`\`${visibleCommands.map(command => command.name).join(', ')}\`\`\``);

      return message.author.send(data.join('\n'))
        .then(() => {
          message.reply(`${emotes.toddHappy} Alright! Help deployed, check yer mailboxes!`);
        })
        .catch((error) => {
          message.reply(`${emotes.toddYell} HELP ABORT! HELP ABORT!\`\`\`${error}\`\`\``)
        });
    }

    // otherwise display help on that command
    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(cmd => cmd.alias && cmd.alias.includes(name));

    if (!command) {
      return message.reply(`${emotes.toddSad} That doesn't seem like a valid revolver... Use \`${prefix}help\` to see all commands!`);
    }

    data.push(`**${command.name.toUpperCase()}** : *${command.description}*`);
    if (command.alias.length > 0) data.push(`> alias: \`${command.alias.join('`, `')}\``);
    if (command.userPerms) data.push(`> permissions: \`${command.userPerms.join('`, `')}\``);
    if (command.guildOnly) data.push(`> guildOnly: true`);
    if (command.ownerOnly) data.push(`> ownerOnly: true`);
    if (command.cooldown) data.push(`> cooldown: ${command.cooldown.toFixed(1)}s`);
    
    if (command.usage && command.usage.args) {
      let use = discUtils.displayCmdUsage(prefix, command.name, command.usage);
      data.push("", use);
    }

    return message.channel.send(data.join(`\n`));
  },
};