const fs = require('fs');
const { prefix, emotes } = require('../../config.json');
const numUtils = require('../../utils/number.js');

// words
const wordListPath = './words_alpha.txt';
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\r\n');

module.exports = {
	name: 'typingtest',
  alias: ['typetest', 'typing', 'type'],
	description: `Checks how fast you're typing!`,
  usage: {
    args: [
      {
        display: 'words',
        description: 'amount of words to type',
        type: 'int',
        limit: [25, 75],
        optional: true
      }
    ]
  },
  
	async execute (message, args) {
    const client = message.client;
    // word amount
    const words = numUtils.getInteger(args[0]) || 50;
    if (words < 25 || words > 100) return message.reply(`${emotes.todd} You should aim to test with [25, 100] words.`);

    // get unique words in length [4, 6]
    let wordArr = [];
    let grossWordLength = 0;
    do {
      const checkWord = Utils.getRandomItem(wordArray);
      if (wordArr.indexOf(checkWord) < 0 && checkWord.length > 3 && checkWord.length < 7) {
        wordArr.push(checkWord);
        grossWordLength += checkWord.length;
      }
    } while (wordArr.length < words)

    // send and starts timer
    // add zero-width space to prevent blatant copying
    const typeTestMsg = await message.reply(`${emotes.toddHappy} It's on! Type these ${words} words:

\u200b\u200b${wordArr.join("\u200b\u200b  \u200b\u200b\u200b")}\u200b\u200b \u200b`);

    // make collection and set collection
    client.typeTest.set(message.author.id, typeTestMsg.createdTimestamp);
    const typeStart = Date.now();
    
    const filter = m => m.author.id === message.author.id && client.typeTest.has(m.author.id);
    const collector = message.channel.createMessageCollector({ filter, time: 5*60*1000 });
    
    collector.on('collect', msg => {
      // availability checker
      if (!client.typeTest.has(msg.author.id)) return collector.stop();

      let typeCheck = msg.content;
      const typeWordCheck = typeCheck.toLowerCase().split(" "); // split by space
      
      // cheat checker
      if (typeCheck.indexOf("\u200b") > -1 || typeCheck.indexOf(" ") > -1) {
        msg.react('❌');
        msg.reply(`${emotes.toddYell} No cheating! Typing test.. CANCELLED!!`);
        client.typeTest.delete(msg.author.id);
        return collector.stop();
      }
      
      // get errors, and stop if too many errors
      let errorCount = 0;
      let errorWordsStr = [];
      let errorWords = [];
      for (let i = 0; i < wordArr.length; i++) {
        const curWord = typeWordCheck[i];
        const rightWord = wordArr[i];

        if (!curWord || curWord !== rightWord) {
          errorWordsStr.push(`**~~${rightWord}~~**`);
          errorWords.push(curWord);
          errorCount += rightWord.length;
        } else {
          errorWordsStr.push(`${rightWord}`);
        }
      }

      // if there are too many errors, stop the test
      if (errorCount >= grossWordLength / 2) return collector.stop();

      const typeTestTime = (Date.now() - typeStart) / 1000; // get the seconds
      const grossWord = (grossWordLength - errorCount) / 5; // correct words divided by 5
      const grossWPM = grossWord / (typeTestTime / 60); // get the minutes
      
      // send results
      const netWPM = (grossWPM - errorWords.length) / (typeTestTime / 60); // in minutes!
      msg.reply(`${emotes.toddHappy} Typing test finished!

Accuracy: ${wordArr.length - errorWords.length}/${wordArr.length} (**${((1 - errorWords.length / wordArr.length) * 100).toFixed(2)}%**)
Time taken: **${typeTestTime.toFixed(2)}** seconds
WPM: **${netWPM.toFixed(2)}**

${errorWordsStr.join(" ")}`);

      client.typeTest.delete(msg.author.id);
      return collector.stop();
    });
    
    collector.on('end', collected => {
      if (client.typeTest.has(message.author.id)) return message.reply(`${emotes.todd} Typing test cancelled.`);
    });
	},
};