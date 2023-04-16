// snowflake
const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');
dayjs.extend(duration);
const DISCORD_EPOCH = 1420070400000;

module.exports = {
	name: 'miscUtils',
  description: `Misc utilities`,

  getDateDifference (dateObjA, dateObjB, format = 'DD/MM/YYYY') {
    let dayParseA = dayjs(dateObjA);
    let dayParseB = dayjs(dateObjB);
    let duration  = dayjs.duration(dayParseA.diff(dayParseB));

    return duration.format(format);
  },
  
  getDateString (dateObj = new Date(), format = 'DD/MM/YYYY') {
    let dayParse = dayjs(dateObj);
    return dayParse.format(format);
  },
}