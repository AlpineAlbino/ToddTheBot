const { prefix, emotes } = require('../../config.json');
const ToddScriptParser = require('./toddScriptParser.js');

module.exports = {
	name: 'toddscript',
  alias: ['todd', 'todded'],
	description: `Samuel and I wrote some kind of coding language! Maybe you can try!`,
  visible: false,
  usage: {
    args: []
  },
  ownerOnly: true,
  cooldown: 5,
  
	async execute(message, args) {
    if (!args[0]) return;
    if (args[0] === "run") {
      const program = args.slice(1).join(" ");
      
      try {
        ToddScriptParser.parse(message, program);
      }
      catch (error) {
        return message.reply(`${emotes.toddYell} Hunker down! Rogue bullet!\`\`\`${error}\`\`\``);
      }
    }
	},
};