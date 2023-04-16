const { prefix, emotes } = require('../../config.json');
const numUtils = require('../../utils/number.js');

module.exports = {
	name: 'dice',
  alias: ['roll'],
	description: `Rolls some dice! Please put them back in my drawer after you're done.`,
  usage: {
    separator: "d",
    args: [
      {
        display: 'diceCount',
        description: 'amount of dice to roll',
        type: 'int',
        limit: [1, 50],
        optional: false
      },
      {
        display: 'diceSide',
        description: 'sides of the dice',
        type: 'int',
        limit: [4, 200],
        optional: false
      }
    ]
  },
  
	async execute(message, args) {
    const notation = args[0] || "1d6";
    let [count, side] = notation.split("d");

    count = numUtils.getInteger(count);
    side = numUtils.getInteger(side);

    if (count === false || side === false) return message.reply(`${emotes.todd} Both values should be positive integers.`)

    if (count < 1 || side < 4) return message.reply(`${emotes.todd} Dice count must be greater than 1, and dice sides must be greater than 3.`)

    if (count > 50 || side > 200) return message.reply(`${emotes.toddSurprised} Wow, that's a lot of dice and sides.. I don't have that many!`);

    let rolledArr = [];
    for (let i = 0; i < count; i++) {
      rolledArr.push(Math.floor(Math.random() * side) + 1);
    }
    const rolledSum = rolledArr.reduce((partialSum, a) => partialSum + a, 0);

    if (rolledArr.join(", ").length > 1000) return message.reply(`${emotes.toddSurprised} Wow, that's a lot of stuff.. Too lazy counting!`);
    return message.reply(`:game_die: ${rolledArr.join(", ")}\n${emotes.toddHappy} And that's **${rolledSum}**!`);
	},
};