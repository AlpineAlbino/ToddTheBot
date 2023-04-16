const fs = require('fs');
const { prefix, emotes } = require('../../config.json');
const discUtils = require('../../utils/disc.js');
const miscUtils = require('../../utils/misc.js');
const numUtils = require('../../utils/number.js');

const Discord = require('discord.js');

module.exports = {
	name: 'snowflake',
  alias: ['snow', 'timestamp'],
  description: `Shows the time of a snowflake, or time difference between two.`,
  guildOnly: true,
  usage: {
    args: [
      {
        display: 'snowflake',
        description: 'snowflake to view time for',
        type: 'int',
        optional: false
      },
      {
        display: 'snowflake2',
        description: 'second snowflake to find time difference between the first',
        type: 'int',
        optional: true
      }
    ]
  },
  
	async execute(message, args) {
    if (!args[0]) return message.reply(`${emotes.todd} Supply at least one timestamp to view the time.`);

    let timestampA = numUtils.getInteger(args[0]);
    let timestampB = numUtils.getInteger((!args[1]) ? args[0] : args[1]);
    let twoTimestampsMode = !(!args[1]);

    if (timestampA === false || timestampB === false) return message.reply(`${emotes.todd} Either of those aren't valid Discord timestamps.`);

    try {
      let dateA = discUtils.getSnowflakeDate(timestampA);
      let dateB = discUtils.getSnowflakeDate(timestampB);

      let dateFormat = 'MMMM DD[,] YYYY hh:mm:ss A [UTC]';
      let durationFormat = 'Y [years ]M [months ]D [days, ]H [hours ]m [minutes ]s [seconds]';

      if (twoTimestampsMode) {
        // duration
        const isFirstBigger = (dateA.getTime() >= dateB.getTime());
        
        const durationMsg = (isFirstBigger) ? miscUtils.getDateDifference(dateA, dateB, durationFormat) : miscUtils.getDateDifference(dateB, dateA, durationFormat);
        return message.reply(`\`${timestampA}\` **${miscUtils.getDateString(dateA, dateFormat)}**
\`${timestampB}\` **${miscUtils.getDateString(dateB, dateFormat)}**
> Duration: **${durationMsg}**`);
      } else {
        // date
        return message.reply(`\`${timestampA}\` **${miscUtils.getDateString(dateA, dateFormat)}**`);
      }
    }
    catch (err) {
      console.log(err);
      return message.reply(`${emotes.toddYell} Hunker down! Rogue bullet!\`\`\`${err}\`\`\``);
    }
	},
};