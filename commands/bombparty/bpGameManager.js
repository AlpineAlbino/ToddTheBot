const { prefix, emotes } = require('../../config.json');
const numUtils = require('../../utils/number.js');
const arrUtils = require('../../utils/array.js');

// word list
const fs = require('fs');
// Returns the path to the word list which is separated by `\n`
const wordListPath = './words_alpha.txt';
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\r\n');

module.exports = {
	name: 'bpGameManager',
  description: `Manage games of Bombparty`,
  helper: true,
  visible: false,

  alphabet: "abcdefghijklmnopqrstuvwxyz",

  // adds player to Bp queue
  makePlayer (client, user, guildId) {
    const userId = user.id;
    const username = user.username;
    const discrim = user.discriminator;
    const newLetterArr = arrUtils.getArrDifference(module.exports.alphabet.split(""), client.bp.get(guildId).settings.gainOmitLetters.split(""));
    
    // update to collection
    client.bp.get(guildId).players[userId] = {
      "name": username,
      "tag": discrim,
      "lives": client.bp.get(guildId).settings.startLives,
      "streak": 0,
      "words": [],
      "timeTaken": [],
      "unusedLetters": newLetterArr.join("")
    };
  },

  startGame (client, guildGameObj) {
    let currentGameObj = client.bp.get(guildGameObj.id);
    // if game doesn't exist return
    if (!currentGameObj) return;
  
    // next player goes on live, if pos goes out of bounds, reset to 0 to make a cycle
    currentGameObj.currentPos++;
    if (currentGameObj.currentPos >= Object.keys(currentGameObj.players).length) currentGameObj.currentPos = 0;

    let waitTime = 500;
    // since bp is a fast-paced game, only display status after every cycle
    if (currentGameObj.currentPos === 0) {
      currentGameObj.round++; // update cycle
      module.exports.displayGameStatus(currentGameObj);
      waitTime = 3000; // end of cycle gets more waiting time
    }
    // update game obj
    client.bp.set(guildGameObj.id, currentGameObj);
  
    // wait three seconds before making words
    const startRoundTimeout = setTimeout(module.exports.wordMakeUp, waitTime, currentGameObj);
  },

  displayGameStatus (guildGameObj) {
    // if game doesn't exist
    const client = guildGameObj.gameClient;
    const testGameObj = client.bp.get(guildGameObj.id);
    if (!testGameObj) return;
    
    // sort HP, get next up player
    let playersArr = Object.entries(guildGameObj.players);
    const nextUp = playersArr[guildGameObj.currentPos][1].name;
    playersArr.sort((a, b) => b-a);
    
    let playerStatusStr = [];
    for (let i = 0; i < playersArr.length; i++) {
      const player = playersArr[i][1]; // values are at index 1 in Object.entries()
      const streakMult = Math.floor(player.streak/3);
      const fireStreak = (streakMult < 1) ? `` : ` ${":fire:".repeat(streakMult)}`;
      playerStatusStr.push(`> **${player.name}**: **${"❤️".repeat(player.lives)}** [${player.streak} streak${fireStreak}]`);
    }
    const channel = guildGameObj.gameChannel;
    return channel.send(`**ROUND ${guildGameObj.round}** // Next Up: **${nextUp}**\n${playerStatusStr.join('\n')}`);
  },

  wordMakeUp (guildGameObj) {
    let baseWord = "";
    let uniqueWord = false;

    // grab an unused word that has manageable difficulty
    do {
      uniqueWord = true;
      baseWord = arrUtils.getRandomItem(wordArray);
      if (guildGameObj.wordsUsed.indexOf(baseWord) >= 0) uniqueWord = false;
      if (baseWord.length < guildGameObj.settings.minWordLength) uniqueWord = false;
    } while (!uniqueWord)

    const maxIndex = baseWord.length - 3; // indexes start at 0
    const startSubstr = numUtils.getRandomNumber(0, maxIndex, true);
    const substr = baseWord.slice(startSubstr, startSubstr+3);
    
    module.exports.parseAndRun(guildGameObj, baseWord, substr);
  },

  checkWord (submitWord, substr, guildObj) {
    const word = submitWord.toLowerCase();
    let validFlag = false;
    
    // if word isn't in word list return false immediately
    if (wordArray.indexOf(word) < 0) return "nonexist";

    validFlag = (word.indexOf(substr) >= 0);
    
    if (validFlag === true) {
      // if word is shorter than limit return false immediately
      if (word.length < guildObj.settings.minWordLength) return "short";
      // if word is already used return false immediately
      if (guildObj.wordsUsed.indexOf(word) >= 0) return "used";
    }
    return validFlag;
  },

  async damagePlayer (guildGameObj, dmgdPlayer, damage) {
    let client = guildGameObj.gameClient;
    let damageGameObj = client.bp.get(guildGameObj.id);
    if (!damageGameObj) return;

    const dmgdPlayerId = dmgdPlayer[0];
    damageGameObj.players[dmgdPlayerId].lives -= damage;

    // if player dies
    if (damageGameObj.players[dmgdPlayerId].lives < 1) {
      // push player in dead standings and delete from alive obj
      damageGameObj.standings.push(damageGameObj.players[dmgdPlayerId]);
      delete damageGameObj.players[dmgdPlayerId];

      let gameChannel = damageGameObj.gameChannel;
      gameChannel.send(`:skull: OOF! **${dmgdPlayer[1].name}** is out!`);
    }

    // update changes to collection
    client.bp.set(damageGameObj.id, damageGameObj);

    // if there's only one person left (aka. the current player)
    if (Object.keys(damageGameObj.players).length < 2) {
      // get to outro
      let winnerId = Object.keys(damageGameObj.players)[0];
      damageGameObj.standings.push(damageGameObj.players[winnerId]);
      const clearOutroTimeout = setTimeout(module.exports.endGame, 3000, client, damageGameObj);
    } else {
      const startRoundTimeout = setTimeout(module.exports.startGame, 1500, client, endGameObj);
    }
  },

  // starts the round (for realsies!)
  async parseAndRun (guildGameObj, baseWord, substr) {
    // client & game object, if game obj doesn't exist return immediately
    let client = guildGameObj.gameClient;
    let currentGameObj = client.bp.get(guildGameObj.id);
    if (!currentGameObj) return;

    // set current player, timer
    const currentPlayer = Object.entries(currentGameObj.players)[currentGameObj.currentPos];
    const roundStartTimestamp = Date.now();
    const timeLimit = currentGameObj.settings.timeLimit;

    // send message
    let gameChannel = currentGameObj.gameChannel;
    const sendMsg = `<@${currentPlayer[0]}> is up! // **${timeLimit}** seconds for **\`${substr.toUpperCase()}\`** // \`${currentPlayer[1].unusedLetters}\` left`;
    gameChannel.send(sendMsg);

    currentGameObj.currentSuccess = false;
    client.worded.set(currentGameObj.id, currentGameObj);

    // start timer
    let timestampStart = Date.now();

    // only collect from the current player
    const filter = (msg) => (msg.author.id === currentPlayer[0]);
    const collector = gameChannel.createMessageCollector({ filter, time: timeLimit*1000 });
    currentGameObj.gameCollector = collector;

    // every time the player sends anything in the channel
    collector.on('collect', async (msg) => {
      // check word validity
      const submitWord = msg.content.toLowerCase();
      const validWord = module.exports.checkWord(submitWord, substr, currentGameObj);
        
      // if word is...
      if (validWord === false) {
        return msg.react('❌');
      } else {
        // if nonexist
        if (validWord === "nonexist") return msg.react('❔');
        // if under length limit
        if (validWord === "short") return msg.react('🔢');
        // if used
        if (validWord === "used") return msg.react('👥');
        
        let timestampSend = Date.now();
        // somehow send right around the time collector ends
        if (timestampSend - timestampStart >= timeLimit*1000 - 500) return; // lol deduct 1 second for safety

        // nice! you did it!
        await msg.react('✅');
        
        let setGuildGameObj = client.bp.get(msg.guild.id);

        // put word in used array
        setGuildGameObj.wordsUsed.push(submitWord.toLowerCase());
        // stop collector
        if (!setGuildGameObj.gameCollector.ended) await setGuildGameObj.gameCollector.stop();

        // set time, words used, letters used, streak
        const timeTaken = (Date.now() - roundStartTimestamp) / 1000;

        setGuildGameObj.players[currentPlayer[0]].timeTaken.push(timeTaken);
        setGuildGameObj.players[currentPlayer[0]].words.push(submitWord);
        setGuildGameObj.players[currentPlayer[0]].streak++;

        // remove letters used
        let unusedLettersArr = setGuildGameObj.players[currentPlayer[0]].unusedLetters.split("");
        let newUnusedLettersArr = arrUtils.getArrDifference(unusedLettersArr, submitWord.split(""));
        setGuildGameObj.players[currentPlayer[0]].unusedLetters = newUnusedLettersArr.join("");

        // heal if all letters are used
        if (setGuildGameObj.players[currentPlayer[0]].unusedLetters.length < 1) {
          await msg.react('💖');
          const newLetterArr = arrUtils.getArrDifference(module.exports.alphabet.split(""), setGuildGameObj.settings.gainOmitLetters.split(""));
          setGuildGameObj.players[currentPlayer[0]].unusedLetters = newLetterArr.join("");
          setGuildGameObj.players[currentPlayer[0]].lives += (setGuildGameObj.players[currentPlayer[0]].lives >= setGuildGameObj.settings.maxLives) ? 0 : 1;
        }
        
        // update changes to collection
        client.bp.set(msg.guild.id, setGuildGameObj);
        const startRoundTimeout = setTimeout(module.exports.startGame, 1000, client, setGuildGameObj);
      }
      
    });

    // fifteen seconds passed, or the game was stopped
    collector.on('end', async (collected) => {
      client = guildGameObj.gameClient;
      let endGameObj = client.bp.get(guildGameObj.id);

      let timestampSend = Date.now();
      // somehow send right around the time collector ends
      if (timestampSend - timestampStart <= timeLimit*1000 - 500) return; // lol deduct 1 second for safety

      // if the game still exists
      if (!(!endGameObj)) {
        // if wordArray.length = round-1 then it means this event was emitted by success word play
        if (endGameObj.currentSuccess === false) {
          // player loses streak, maybe timepoison too, and gets skipped
          endGameObj.players[currentPlayer[0]].streak = 0;
          
          // update changes to collection
          client.bp.set(guildGameObj.id, endGameObj);
          
          gameChannel.send(`${emotes.toddSad} Looks like **${currentPlayer[1].name}** didn't respond in time... \`${baseWord}\` was my word!`);
          await module.exports.damagePlayer(endGameObj, currentPlayer, 1);
        }
      }
    });
  },

  // game finisher (only called when there's a winner)
  async endGame (client, guildGameObj) {
    // client and guildGameObj
    let endGameObj = client.bp.get(guildGameObj.id);
    const finalTime = Date.now();
    endGameObj.timestamp[1] = finalTime;

    // winner is the only entry left in the players sub-object
    const winner = Object.entries(endGameObj.players)[0];
    const finalStandingsArr = endGameObj.standings.reverse(); // get everyone's standings
    let finalStandingsMsgArr = [];

    // luckily we sorted it first, so we can go through them one-by-one
    for (let i = 0; i < finalStandingsArr.length; i++) {
      const endPlayer = finalStandingsArr[i];
      const placement = i+1;
      const wordsSent = endPlayer.timeTaken.length;
      const avgWordLength = numUtils.getAverage(endPlayer.words.map((w) => w.length)).toFixed(2);
      const avgTime = numUtils.getAverage(endPlayer.timeTaken).toFixed(2);
      finalStandingsMsgArr.push(`> #${placement} **${endPlayer.name}** [${wordsSent} rounds, ${avgWordLength} avg word length, ${avgTime}s avg time]`);
    }

    // announce the winner, and everyone else's standings
    let gameChannel = endGameObj.gameChannel;
    const timeTotal = ((endGameObj.timestamp[1] - endGameObj.timestamp[0]) / 1000).toFixed(2);
    gameChannel.send(`**GAME SET** // Winner is **${winner[1].name}**! // Thanks for playing!
Total game time: ${timeTotal} seconds, ${endGameObj.wordsUsed.length} words used

${finalStandingsMsgArr.join("\n")}`);

    // ends the collector if it somehow hasn't stopped
    if (!endGameObj.gameCollector.ended) await endGameObj.gameCollector.stop();
    client.bp.delete(endGameObj.id); // delete the guild from collection
  },
}