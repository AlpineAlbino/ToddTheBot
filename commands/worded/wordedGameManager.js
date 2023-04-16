const { prefix, emotes } = require('../../config.json');

const WordedGameMaker = require('./wordedMaker.js');
const fs = require('fs');

module.exports = {
	name: 'wordedGameManager',
  description: `Manage games of Worded`,
  helper: true,
  visible: false,

  // adds player to Worded queue
  makePlayer (client, user, guildId) {
    const userId = user.id;
    const username = user.username;
    const discrim = user.discriminator;

    // update to collection
    client.worded.get(guildId).players[userId] = {
      "name": username,
      "tag": discrim,
      "hp": client.worded.get(guildId).settings.startHP,
      "dmgMult": 1,
      "dmgTaken": 0,
      "dmgDealt": 0,
      "streak": 0,
      "exact": 0,
      "words": [],
      "timeTaken": []
    };
  },
  
  // game session display
  displayGameStatus (guildGameObj) {
    // sort HP, get next up player
    let playersArr = Object.entries(guildGameObj.players);
    const nextUp = playersArr[guildGameObj.currentPos][1].name;
    playersArr.sort((a, b) => b-a);
    
    let playerStatusStr = [];
    for (let i = 0; i < playersArr.length; i++) {
      const player = playersArr[i][1]; // values are at index 1 in Object.entries()
      playerStatusStr.push(`> **${player.name}**: **${player.hp}**hp [${player.streak} streak]`);
    }
    const channel = guildGameObj.gameChannel;
    return channel.send(`**ROUND ${guildGameObj.round}** // Next Up: **${nextUp}**\n${playerStatusStr.join('\n')}`);
  },
}

// round starter
const startGame = (client, guildGameObj) => {
  let currentGameObj = client.worded.get(guildGameObj.id);

  // next player goes on live, if pos goes out of bounds, reset to 0 to make a cycle
  currentGameObj.round++;
  currentGameObj.currentPos++;
  if (currentGameObj.currentPos >= Object.keys(currentGameObj.players).length) currentGameObj.currentPos = 0;

  // display info and update data to collection
  module.exports.displayGameStatus(currentGameObj);
  client.worded.set(guildGameObj.id, currentGameObj);

  // wait five seconds before making words
  const startRoundTimeout = setTimeout(WordedGameMaker.wordMakeUp, 5000, currentGameObj);
};

module.exports.startGame = startGame;