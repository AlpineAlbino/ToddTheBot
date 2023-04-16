const { prefix, emotes } = require('../../config.json');

module.exports = {
	name: 'choose',
  alias: ['pick'],
	description: `Allows me to make up your mind! Please no politics...`,
  usage: {
    separator: "|",
    args: [
      {
        display: 'choice_1',
        description: '1st choice',
        type: 'text',
        optional: false
      },
      {
        display: 'choice_2',
        description: '2nd choice',
        type: 'text',
        optional: false
      },
      {
        display: 'choices',
        description: 'additional choices',
        type: 'text',
        optional: true,
        repeatable: true
      }
    ]
  },
  
	async execute(message, args) {
    if (!args[0]) return message.reply(`${emotes.todd} I know you're indecisive, but remember to put some choices in.`);
    
		const choicesArr = args.join(" ").split("|");
    if (choicesArr.length === 1) return message.reply(`${emotes.toddHappy} Well, there's no other choice: **${choicesArr[0].trim()}**!`);
    
    const choice = choicesArr[Math.floor(Math.random() * choicesArr.length)];

    if (choice.length < 1) return message.reply(`${emotes.toddSurprised} I think that's a whitespace..? That a valid option?`);
    if (choice.length > 1900) return message.reply(`${emotes.toddSurprised} That's a pretty long choice... I'm not repeating all of *that*...`);
    return message.reply(`${emotes.toddHappy} **${choice.trim()}**!`);
	},
};