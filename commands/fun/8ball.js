const { prefix, emotes } = require('../../config.json');

module.exports = {
	name: '8ball',
  alias: ['8'],
	description: `Asks this magic orb that Raven left behind! It helped me a lot.`,
  usage: {
    args: [
      {
        display: 'question',
        description: 'question to be answered',
        type: 'text',
        optional: true
      }
    ]
  },
  
	async execute(message, args) {
    if (!args[0]) return message.reply(`${emotes.toddYell} Well, ask something! I want to know, too!`);
    
    const messages = ["As I see it, yes.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.", "Don’t count on it.", "It is certain.", "It is decidedly so.", "Most likely.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Outlook good.", "Reply hazy, try again.", "Signs point to yes.", "Very doubtful.", "Without a doubt.", "Yes.", "Yes – definitely.", "You may rely on it."];
    
    return message.reply(`:8ball: "${messages[Math.floor(Math.random() * messages.length)]}"`);
	},
};