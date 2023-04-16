const { prefix, emotes } = require('../../config.json');
const fs = require('fs');

const Discord = require('discord.js');

module.exports = {
	name: 'cashierGameManager',
	description: `Helper for cashier the game`,
  visible: false,
  helper: true,

  // start game after timer ended
  startGame (client, guildGameObj) {
    let currentGameObj = client.cashier.get(guildGameObj.id);
    // if game doesn't exist return
    if (!currentGameObj) return;
    
    // 0. before each round we'll show current standings:
    //    rank - name - money
    // 0. after N rounds the one with least money collected will be fired
    //    there might be a winner, so show them
    
    // 1. send an image with coins and bills scattered,
    //    everyone has 15s to count up the money,
    //    whoever gets it right gets the value, bonus if you get it fast
    // 2. update lb

    // wait some time before sending the standings
    let waitTime = 3 * 1000;
    
    // if round = 0, send a welcome message
    if (currentGameObj.round === 0) {
      currentGameObj.gameChannel.send(`${emotes.toddHappy} **Welcome to your new job!** Here's a quick reminder of how this game works:
- Everyone starts off with **$0**. Your goal is to count the money displayed in the images I'll be sending you.
- The fastest people to correctly sum the money up gets that amount in their balance.
- After some rounds, the people with the least money will be disqualified.
- This process repeats until we have one person left! Good luck to the best cashier!`);

      // and wait several seconds before pasting current standings
      waitTime = 15 * 1000;
    }

    // display lb regardless
    const startRoundTimeout = setTimeout(module.exports.displayStandings, waitTime, currentGameObj);
    
  },

  // display lb function
  displayStandings (guildGameObj) {
    // if game doesn't exist
    const client = guildGameObj.gameClient;
    const testGameObj = client.cashier.get(guildGameObj.id);
    if (!testGameObj) return;
    
    // sort money, and send warning for next round
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

  // adds player to cashier queue
  makePlayer (client, user, guildId) {
    const userId = user.id;
    const username = user.username;
    const discrim = user.discriminator;
    
    // update to collection
    client.cashier.get(guildId).players[userId] = {
      "name": username,
      "tag": discrim,
      "money": 0,
      "streak": 0,
      "timeTaken": [],
    };
  },
};