const { prefix, emotes } = require('../../config.json');
const Utils = require('../../utils.js');
const numUtils = require('../../utils/number.js');
const arrUtils = require('../../utils/array.js');
const strUtils = require('../../utils/string.js');
const wordUtils = require('../../utils/word.js');

// word list
const fs = require('fs');
// Returns the path to the word list which is separated by `\n`
const wordListPath = './words_alpha.txt';
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\r\n');

module.exports = {
	name: 'wordedGameMaker',
  description: `Manage word and rule creation`,
  helper: true,
  visible: false,

  checkWord (word, rulesObj, guildObj) {
    word = word.toLowerCase();
    const rulesArr = Object.entries(rulesObj.rules);
    
    // if word is exactly the given word then return true immediately
    if (word === rulesObj.word) return "exact";
    // if word isn't in word list return false immediately
    if (wordArray.indexOf(word) < 0) return "nonexist";
    
    let validFlag = true;
    for (let i = 0; i < rulesArr.length; i++) {
      const ruleName = rulesArr[i][0];
      const ruleDesc = rulesArr[i][1];

      switch (ruleName) {
        case "minLength":
          validFlag = (word.length >= ruleDesc);
          break;
        case "maxLength":
          validFlag = (word.length <= ruleDesc);
          break;
        case "exactLength":
          validFlag = (word.length === ruleDesc);
          break;
        case "minVowel":
          validFlag = (strUtils.getUniqueString(strUtils.getVowels(word)).length >= ruleDesc);
          break;
        case "maxVowel":
          validFlag = (strUtils.getUniqueString(strUtils.getVowels(word)).length <= ruleDesc);
          break;
        case "minConsonant":
          validFlag = (strUtils.getUniqueString(strUtils.getConsonants(word)).length >= ruleDesc);
          break;
        case "maxConsonant":
          validFlag = (strUtils.getUniqueString(strUtils.getConsonants(word)).length <= ruleDesc);
          break;
        case "startWith":
          validFlag = (word.slice(0, ruleDesc.length) === ruleDesc);
          break;
        case "endWith":
          validFlag = (word.slice(-ruleDesc.length) === ruleDesc);
          break;
        case "notStartWith":
          const wordCheck1 = word;
          function notStartWith (checkLetter) {
            return (checkLetter !== wordCheck1);
          }
          validFlag = ruleDesc.every(notStartWith);
          break;
        case "notEndWith":
          const wordCheck2 = word;
          function notEndWith (checkLetter) {
            return (checkLetter !== wordCheck2.slice(-1));
          }
          validFlag = ruleDesc.every(notEndWith);
          break;
        case "has":
          const wordCheck3 = word;
          function hasThis (checkLetter) {
            return (wordCheck3.indexOf(checkLetter) >= 0);
          }
          validFlag = ruleDesc.every(hasThis);
          break;
        case "notHas":
          const wordCheck4 = word;
          function notHasThis (checkLetter) {
            return (wordCheck4.indexOf(checkLetter) < 0);
          }
          validFlag = ruleDesc.every(notHasThis);
          break;
        case "substring":
          validFlag = (word.indexOf(ruleDesc) >= 0);
          break;
      }
      if (validFlag === false) break;
    }
    
    if (validFlag === true) {
      // if word is shorter than limit return false immediately
      if (word.length < guildObj.settings.minWordLength) return "short";
      // if word is already used return false immediately
      if (guildObj.wordsUsed.indexOf(word) >= 0) return "used";
    }
    return validFlag;
  },
  
  ruleDisplay (rulesObj) {
    // display rules
    const rulesArr = Object.entries(rulesObj.rules);
    let rulesStrArr = [];

    for (let i = 0; i < rulesArr.length; i++) {
      let msg = `> `;
      const ruleInfo = rulesArr[i][1];
      switch (rulesArr[i][0]) {
        case "minLength":
          msg += `be **at least \`${ruleInfo}\`** characters long`;
          break;
        case "maxLength":
          msg += `be **at most \`${ruleInfo}\`** characters long`;
          break;
        case "exactLength":
          msg += `be **exactly \`${ruleInfo}\`** characters long`;
          break;
        case "minVowel":
          msg += `have **at least \`${ruleInfo}\`** unique vowels`;
          break;
        case "maxVowel":
          msg += `have **at most \`${ruleInfo}\`** unique vowels`;
          break;
        case "minConsonant":
          msg += `have **at least \`${ruleInfo}\`** unique consonants`;
          break;
        case "maxConsonant":
          msg += `have **at most \`${ruleInfo}\`** unique consonants`;
          break;
        case "startWith":
          msg += `start with **\`${ruleInfo}\`**`;
          break;
        case "endWith":
          msg += `end with **\`${ruleInfo}\`**`;
          break;
        case "notStartWith":
          msg += `**NOT** start with **\`${strUtils.naturalList(ruleInfo, ", ", "or ")}\`**`;
          break;
        case "notEndWith":
          msg += `**NOT** end with **\`${strUtils.naturalList(ruleInfo, ", ", "or ")}\`**`;
          break;
        case "has":
          msg += `have **\`${strUtils.naturalList(ruleInfo, ", ", "and ")}\`**`;
          break;
        case "notHas":
          msg += `**NOT** have **\`${strUtils.naturalList(ruleInfo, ", ", "or ")}\`**`;
          break;
        case "substring":
          msg += `contain the exact **\`${ruleInfo}\`** substring`;
          break;
      }
      rulesStrArr.push(msg);
    }

    return rulesStrArr;
  },

  // makes rules based on given word
  ruleMakeUp (guildGameObj, baseWordObj) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

    // some rules aren't compatible with other rules
    function checkDisallowCombine (rulesArr, baseRule) {
      const disallowCombine = {
        "exactLength": ["minLength", "maxLength", "minVowel", "maxVowel"],
        "minLength": ["exactLength"],
        "maxLength": ["exactLength"],
        "maxVowel": ["minVowel", "exactLength"],
        "minVowel": ["maxVowel", "exactLength"],
        "startWith": ["notStartWith"],
        "notStartWith": ["startWith"],
        "endWith": ["notEndWith"],
        "notEndWith": ["endWith"],
        "has": ["substring"],
        "substring": ["has"]
      }
      let disallowFlag = true;
      
      for (let i = 0; i < rulesArr.length; i++) {
        const disallowed = disallowCombine[rulesArr[i]];
        if (!(!disallowed) && disallowed.indexOf(baseRule) >= 0) disallowFlag = false;
      }
      return disallowFlag;
    }

    // all rules and their base difficulty (for dmgMult)
    let allRules = {
      "minLength": 2,
      "maxLength": 5,
      "exactLength": 15,
      "minVowel": 3,
      "maxVowel": 3,
      "minConsonant": 2,
      "maxConsonant": 5,
      "startWith": 3,
      "endWith": 3,
      "notStartWith": 1,
      "notEndWith": 1,
      "has": 4,
      "notHas": 3,
      "substring": 4
    };
    
    let rulesObj = {
      "word": baseWordObj.word,
      "count": 0,
      "multAward": 1,
      "rules": {}
    };
    let rulesArr = [];

    // decide how many rules there should be
    const minLength = guildGameObj.settings.minWordLength;
    const ruleCount = numUtils.getMin([guildGameObj.settings.maxRules, 2 + (Math.floor(guildGameObj.round / 20)) + numUtils.getRandomNumber(-1, 0, true)]);
    let multAward = 0;

    // rule distribution
    const allRulesBaseDifficulty = Object.values(allRules);
    const properRulesDist = allRulesBaseDifficulty.map((value) => numUtils.getMax(allRulesBaseDifficulty) / value);
    
    for (let i = 0; i < ruleCount; i++) {
      let baseRule, baseRuleReq;
      let ruleDisallowed = true;
      do {
        ruleDisallowed = false;
        baseRule = arrUtils.getRandomDistributed(Object.entries(allRules), properRulesDist);
        if (rulesArr.indexOf(baseRule[0]) >= 0 || checkDisallowCombine(rulesArr, baseRule[0]) === false) ruleDisallowed = true;
      } while (ruleDisallowed);

      switch (baseRule[0]) {
        case "minLength":
          baseRuleReq = numUtils.getMax([Math.floor(baseWordObj.length / 1.7) + numUtils.getRandomNumber(-1, 1, true), minLength]);
          multAward += baseRule[1] + Math.floor(baseRuleReq / 2);
          break;
        case "maxLength":
          baseRuleReq = Math.floor(baseWordObj.length * 1.2) + numUtils.getRandomNumber(1, 2, true);
          multAward += numUtils.getMax(2, 10 - Math.floor(baseRuleReq / 1.2));
          break;
        case "exactLength":
          baseRuleReq = baseWordObj.length;
          multAward += baseRule[1];
          break;
        case "minVowel":
          baseRuleReq = numUtils.clamp(Math.floor(baseWordObj.vowels / 2), 1, 5);
          multAward += baseRule[1] + Math.floor(baseRuleReq / 1.2);
          break;
        case "maxVowel":
          baseRuleReq = numUtils.clamp(Math.floor(baseWordObj.vowels * 1.2) + numUtils.getRandomNumber(1, 2, true), 1, 5);
          multAward += numUtils.getMax(2, 4 - baseRuleReq);
          break;
        case "minConsonant":
          baseRuleReq = numUtils.clamp(Math.floor(baseWordObj.consonants / 1.5), 1, 21);
          multAward += baseRule[1] + Math.floor(baseRuleReq / 1.5);
          break;
        case "maxConsonant":
          baseRuleReq = numUtils.clamp(Math.floor(baseWordObj.consonants * 1.3) + numUtils.getRandomNumber(1, 3, true), 1, 21);
          multAward += numUtils.getMax(2, 10 - baseRuleReq);
          break;
        case "startWith":
          baseRuleReq = baseWordObj.word.slice(0, Math.floor(baseWordObj.length / 3));
          multAward += baseRule[1] + baseRuleReq.length;
          break;
        case "endWith":
          baseRuleReq = baseWordObj.word.slice(-Math.floor(baseWordObj.length / 3));
          multAward += baseRule[1] + baseRuleReq.length;
          break;
        case "notStartWith":
          const notStartCount = Math.floor(baseWordObj.length / 5);
          let notStartAll = arrUtils.getArrDifference(alphabet, [baseWordObj.word[0]]);
          let selectNotStart = arrUtils.arrayify(arrUtils.getRandomItem(notStartAll, notStartCount));
          
          baseRuleReq = selectNotStart;
          multAward += baseRule[1] + Math.floor(notStartCount / 2);
          break;
        case "notEndWith":
          const notEndCount = Math.floor(baseWordObj.length / 5);
          let notEndAll = arrUtils.getArrDifference(alphabet, [baseWordObj.word.slice(-1)]);
          let selectNotEnd = arrUtils.arrayify(arrUtils.getRandomItem(notEndAll, notEndCount));
          
          baseRuleReq = selectNotEnd;
          multAward += baseRule[1] + Math.floor(notEndCount / 2);
          break;
        case "has":
          const hasCount = Math.floor(baseWordObj.length / 3);
          let hasAll = arrUtils.getArrIntersect(alphabet, baseWordObj.word.split(""))
          let has = arrUtils.arrayify(arrUtils.getRandomItem(hasAll, hasCount));
          
          baseRuleReq = has;
          multAward += baseRule[1] + hasCount;
          break;
        case "notHas":
          const notHasCount = Math.floor(baseWordObj.length / 3);
          let notHasAll = arrUtils.getArrDifference(alphabet, baseWordObj.word.split(""));
          let notHas = arrUtils.arrayify(arrUtils.getRandomItem(notHasAll, notHasCount));
          
          baseRuleReq = notHas;
          multAward += baseRule[1] + Math.floor(notHasCount / 1.5);
          break;
        case "substring":
          const subCount = Math.floor(baseWordObj.length / 3);
          const maxIndex = baseWordObj.length - subCount - 1; // indexes start at 0
          const startSubstr = numUtils.getRandomNumber(0, maxIndex, true);
          let substr = baseWordObj.word.slice(startSubstr, startSubstr+subCount+1); // inclusive
          baseRuleReq = substr;
          multAward += baseRule[1] + Math.floor(subCount / 2);
          break;
      }

      rulesArr.push(baseRule[0]);
      rulesObj.rules[baseRule[0]] = baseRuleReq;
    }

    rulesObj.multAward += multAward / 6;
    rulesObj.count = ruleCount;
    return rulesObj;
  },
  
  wordMakeUp (guildGameObj) {
    let baseWord = "";
    let uniqueWord = false;

    // grab an unused word that has manageable difficulty
    do {
      uniqueWord = true;
      baseWord = arrUtils.getRandomItem(wordArray);
      const difficulty = wordUtils.getWordDifficulty(baseWord);
      const maxDifficulty = 3 + Math.floor(guildGameObj.round / 10);
      if (guildGameObj.wordsUsed.indexOf(baseWord) >= 0) uniqueWord = false;
      if (difficulty === false || difficulty > maxDifficulty) uniqueWord = false;
      if (baseWord.length < guildGameObj.settings.minWordLength) uniqueWord = false;
    } while (!uniqueWord)

    // list all properties to help make rules
    const wordProperties = {
      "word": baseWord,
      "length": baseWord.length,
      "vowels": strUtils.getUniqueString(strUtils.getVowels(baseWord)).length,
      "consonants": strUtils.getUniqueString(strUtils.getConsonants(baseWord)).length,
      "difficulty": wordUtils.getWordDifficulty(baseWord)
    }

    // make rules based on the given word
    let rulesObj = module.exports.ruleMakeUp(guildGameObj, wordProperties);
    console.log(rulesObj);
    // runs the round
    module.exports.parseAndRun(guildGameObj, rulesObj);
  },

  async damagePlayer (guildGameObj, dmgdPlayer, damage) {
    let client = guildGameObj.gameClient;
    let damageGameObj = client.worded.get(guildGameObj.id);
    if (!damageGameObj) return;

    const dmgdPlayerId = dmgdPlayer[0];
    damageGameObj.players[dmgdPlayerId].hp -= damage;
    damageGameObj.players[dmgdPlayerId].dmgTaken += damage;

    // if player dies
    if (damageGameObj.players[dmgdPlayerId].hp < 1) {
      // push player in dead standings and delete from alive obj
      damageGameObj.standings.push(damageGameObj.players[dmgdPlayerId]);
      delete damageGameObj.players[dmgdPlayerId];

      let gameChannel = damageGameObj.gameChannel;
      gameChannel.send(`:skull: OOF! **${dmgdPlayer[1].name}** is out!`);
    }

    // update changes to collection
    client.worded.set(damageGameObj.id, damageGameObj);

    // if there's only one person left (aka. the current player)
    if (Object.keys(damageGameObj.players).length < 2) {
      // get to outro
      let winnerId = Object.keys(damageGameObj.players)[0];
      damageGameObj.standings.push(damageGameObj.players[winnerId]);
      const clearOutroTimeout = setTimeout(module.exports.endGame, 3000, client, damageGameObj);
    }
  },

  // starts the round (for realsies!)
  async parseAndRun (guildGameObj, rulesObj) {
    // client & game object, if game obj doesn't exist return immediately
    let client = guildGameObj.gameClient;
    let currentGameObj = client.worded.get(guildGameObj.id);
    if (!currentGameObj) return;

    // grab rules to display as message, formatted in array
    let rulesDisplay = module.exports.ruleDisplay(rulesObj);

    // set current player, timer
    const currentPlayer = Object.entries(currentGameObj.players)[currentGameObj.currentPos];
    const roundStartTimestamp = Date.now();
    const timeLimit = currentGameObj.settings.timeLimit;

    // send message
    let gameChannel = currentGameObj.gameChannel;
    const sendMsg = `**ROUND ${currentGameObj.round}**
<@${currentPlayer[0]}> is up! // You have **${timeLimit}** seconds to send an unused word that MUST:
${rulesDisplay.join("\n")}`;
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
      const currentRuleObj = rulesObj;
      const validWord = module.exports.checkWord(submitWord, currentRuleObj, currentGameObj);
        
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
        const exactWord = (validWord === "exact");
        await msg.react((exactWord) ? '🌠' : '✅');
        
        let setGuildGameObj = client.worded.get(msg.guild.id);

        // put word in used array
        setGuildGameObj.wordsUsed.push(submitWord.toLowerCase());
        setGuildGameObj.currentSuccess = true;
        // stop collector
        if (!setGuildGameObj.gameCollector.ended) await setGuildGameObj.gameCollector.stop();

        // set time and damage, accounting for streak too
        const timeTaken = (Date.now() - roundStartTimestamp) / 1000;

        setGuildGameObj.players[currentPlayer[0]].timeTaken.push(timeTaken);
        setGuildGameObj.players[currentPlayer[0]].words.push(submitWord);
        setGuildGameObj.players[currentPlayer[0]].streak++;
        
        const streakMult = Math.floor(setGuildGameObj.players[currentPlayer[0]].streak / 3);
        const fireStreak = (streakMult < 1) ? " " : ` ${":fire:".repeat(streakMult)} `;

        setGuildGameObj.players[currentPlayer[0]].exact += (exactWord) ? 3 : 0;
        const exact = setGuildGameObj.players[currentPlayer[0]].exact;
        const exactHealMsg = (exactWord) ? `**${currentPlayer[1].name}** heals **${exact}**hp!` : ``;
        setGuildGameObj.players[currentPlayer[0]].hp += exact;

        const timeNr = timeTaken / timeLimit;
        const timeMult = 1 + (Math.pow(timeNr, 5));

        const wordDifficulty = wordUtils.getWordDifficulty(submitWord)
        const baseDmg = Math.floor(rulesObj.multAward);
        const finalDmg = Math.floor(baseDmg * (1 + 0.167*streakMult) * timeMult * numUtils.getRoot(wordDifficulty, 2) * numUtils.getRoot(submitWord.length, 6));

        // announce and pull damage
        const exactMsg = (exactWord) ? ` spot on got my word! 🌠 ` : ` got it! `;
        await gameChannel.send(`**${currentPlayer[1].name}**${exactMsg}Everyone else takes **${finalDmg}**${fireStreak}damage!
${exactHealMsg}`);
        setGuildGameObj.players[currentPlayer[0]].dmgDealt += finalDmg;

        // everyone else loses HP
        const otherPlayers = Object.entries(setGuildGameObj.players).filter(u => u[0] !== msg.author.id);
        // sort HP from lowest to highest, so if they die they place lower
        otherPlayers.sort((a, b) => a-b);
        for (let i = 0; i < otherPlayers.length; i++) {
          await module.exports.damagePlayer(setGuildGameObj, otherPlayers[i], finalDmg);
        }

        // update changes to collection
        client.worded.set(msg.guild.id, setGuildGameObj);
        const startRoundTimeout = setTimeout(module.exports.startGame, 3000, client, setGuildGameObj);
      }
      
    });

    // fifteen seconds passed, or the game was stopped
    collector.on('end', async (collected) => {
      client = guildGameObj.gameClient;
      let endGameObj = client.worded.get(guildGameObj.id);

      let timestampSend = Date.now();
      // somehow send right around the time collector ends
      if (timestampSend - timestampStart <= timeLimit*1000 - 500) return; // lol deduct 1 second for safety

      // if the game still exists
      if (!(!endGameObj)) {
        // if wordArray.length = round-1 then it means this event was emitted by success word play
        if (endGameObj.currentSuccess === false) {
          // player loses streak, maybe timepoison too, and gets skipped
          endGameObj.players[currentPlayer[0]].streak = 0;
          const timePoison = endGameObj.settings.timePoison;
          await module.exports.damagePlayer(endGameObj, currentPlayer, timePoison);
          
          // update changes to collection
          client.worded.set(guildGameObj.id, endGameObj);
          
          gameChannel.send(`${emotes.toddSad} Looks like **${currentPlayer[1].name}** didn't respond in time... Time Poison deals **${timePoison}** damage!
> In case you're wondering, my word was \`${rulesObj.word}\`!`);
          const startRoundTimeout = setTimeout(module.exports.startGame, 3000, client, endGameObj);
        }
      }
    });
  },

  // game finisher (only called when there's a winner)
  async endGame (client, guildGameObj) {
    // client and guildGameObj
    let endGameObj = client.worded.get(guildGameObj.id);
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
Total game time: ${timeTotal} seconds

${finalStandingsMsgArr.join("\n")}`);

    // ends the collector if it somehow hasn't stopped
    if (!endGameObj.gameCollector.ended) await endGameObj.gameCollector.stop();
    client.worded.delete(endGameObj.id); // delete the guild from collection
  },

  startGame (client, guildGameObj) {
    let currentGameObj = client.worded.get(guildGameObj.id);
    // if game doesn't exist return
    if (!currentGameObj) return;
  
    // next player goes on live, if pos goes out of bounds, reset to 0 to make a cycle
    currentGameObj.round++;
    currentGameObj.currentPos++;
    if (currentGameObj.currentPos >= Object.keys(currentGameObj.players).length) currentGameObj.currentPos = 0;
  
    // display info and update data to collection
    module.exports.displayGameStatus(currentGameObj);
    client.worded.set(guildGameObj.id, currentGameObj);
  
    // wait five seconds before making words
    const startRoundTimeout = setTimeout(module.exports.wordMakeUp, 5000, currentGameObj);
  },

  displayGameStatus (guildGameObj) {
    // if game doesn't exist
    const client = guildGameObj.gameClient;
    const testGameObj = client.worded.get(guildGameObj.id);
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
      const exactMult = Math.floor(player.exact/3);
      const exactStreak = (exactMult < 1) ? `` : ` ${"🌠".repeat(exactMult)}`;
      playerStatusStr.push(`> **${player.name}**: **${player.hp}**hp [${player.streak} streak${fireStreak}${exactStreak}]`);
    }
    const channel = guildGameObj.gameChannel;
    return channel.send(`**ROUND ${guildGameObj.round}** // Next Up: **${nextUp}**\n${playerStatusStr.join('\n')}`);
  },
}