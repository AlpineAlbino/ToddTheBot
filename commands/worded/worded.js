const { prefix, emotes } = require('../../config.json');
const numUtils = require('../../utils/number.js');

// worded-specific
const WordedGameManager = require('./wordedGameManager.js');
const Discord = require('discord.js');

module.exports = {
	name: 'worded',
  alias: [],
	description: `that hit game I created! Test your English vocabulary!`,
  visible: false,
  guildOnly: true,
  cooldown: 3,
  usage: {},
  
	async execute(message, args) {
    const client = message.client;
    let guildGameObj = client.worded.get(`${message.guild.id}`);

    if (args[0] === "set" || args[0] === "setting" || args[0] === "settings") {
      if (!guildGameObj) return message.reply(`${emotes.toddHappy} There're no active games! Be the one who starts by typing \`${prefix}${this.name} start\`!`);

      let setGameObj = client.worded.get(`${message.guild.id}`);
      // only owners can set stuff
      if (guildGameObj.owner !== message.author.id) return message.reply(`${emotes.todd} You're not **${guildGameObj.ownerName}** the game owner, so you can't change settings for this game. Keep rolling, y'all!`);

      if (!args[1]) {
        // display all editable settings, desc, their current value and default values
        let settingsArr = Object.entries(setGameObj.settings.desc);
        let settingsViewArr = [];
        for (let i = 0; i < settingsArr.length; i++) {
          const setting = settingsArr[i];
          const name = setting[0];
          const desc = setting[1];
          settingsViewArr.push(`> **${name}** : ${desc.desc} [${setGameObj.settings[name]}]`);
        }

        return message.reply(`${emotes.toddHappy} Here're the current settings for this game! Change any of these with \`${prefix}${module.exports.name} ${args[0]} {setting} {value}\`.
${settingsViewArr.join('\n')}`);
      }

      if (setGameObj.status === 1) return message.reply(`${emotes.toddSad} The game has already started!`);

      let settingsNameArr = Object.keys(setGameObj.settings.desc).map((item) => item.toLowerCase());
      if (settingsNameArr.indexOf(args[1].toLowerCase()) >= 0) {
        if (!args[2]) return message.reply(`${emotes.todd} You should include a value to set with. Check \`${prefix}${module.exports.name}\` for all settings.`);
        
        const settingsName = args[1].toLowerCase();
        const value = args[2];
        if (numUtils.getInteger(value) === false && setGameObj.settings.intOnly.indexOf(settingsName) >= 0) return message.reply(`${emotes.todd} Values should be integers.`);

        switch (settingsName) {
          case "gamemode":
            const modes = ["worded", "bp", "bombparty", "train", "chain", "ladder"];
            if (modes.indexOf(value) < 0) return message.reply(`${emotes.todd} Gamemodes can be worded, bp, chain, or ladder.`);
            setGameObj.settings.gamemode = value;
            break;
          case "starthp":
            if (value < 20) {
              return message.reply(`${emotes.todd} Min value is 20HP.`);
            } else {
              setGameObj.settings.startHP = value;
              // edit everyone's hp to the new value
              const currentPlayerArr = Object.keys(setGameObj.players);
              for (let i = 0; i < currentPlayerArr.length; i++) {
                const id = currentPlayerArr[i];
                setGameObj.players[id].hp = value;
              }
            }
            break;
          case "minwordlength":
            if (value < 3 || value > 8) {
              return message.reply(`${emotes.todd} Value must be in [3, 8].`);
            } else {
              setGameObj.settings.minWordLength = value;
            }
            break;
          case "timelimit":
            if (value < 5) {
              return message.reply(`${emotes.todd} Min value is 5s.`);
            } else {
              setGameObj.settings.timeLimit = value;
            }
            break;
          case "timepoison":
            if (value < 0) {
              return message.reply(`${emotes.todd} Min value is 0HP.`);
            } else {
              setGameObj.settings.timePoison = value;
            }
            break;
          case "maxrules":
            if (value < 1 || value > 9) {
              return message.reply(`${emotes.todd} Value must be in [1, 9].`);
            } else {
              setGameObj.settings.maxRules = value;
            }
            break;
        }

        client.worded.set(message.guild.id, setGameObj);
        return message.reply(`${emotes.toddHappy} **${settingsName}** set to **${value}**!`);
      }
    }

    if (args[0] === "join") {
      if (!guildGameObj) return message.reply(`${emotes.toddHappy} There're no active games! Be the one who starts by typing \`${prefix}${this.name} start\`!`);
    }
    
    if (args[0] === "quit") {
      if (!guildGameObj) return message.reply(`${emotes.todd} There're no active games.`);
      let playerObj = guildGameObj.players;
      if (!playerObj[message.author.id]) return message.reply(`${emotes.todd} You're not in the game.`);
      let newOwnerMsg = ``;
      
      if (guildGameObj.owner === message.author.id) {
        const oldOwner = guildGameObj.owner;
        if (Object.keys(playerObj).length === 1) return message.reply(`${emotes.todd} You're the only one in the game. Use \`${prefix}${this.name} stop\` to stop the game.`);
        
        // owner still exists as index 0, so new owner is index 1
        const newOwner = Object.keys(client.worded.get(`${message.guild.id}`).players)[1];
        const newOwnerName = client.worded.get(message.guild.id).players[newOwner].name;
        guildGameObj.owner = newOwner;

        // remember to update to collection!
        client.worded.set(guildGameObj.id, guildGameObj);
        newOwnerMsg = ` **${newOwnerName}** shall step up as the new owner!`;
      }

      // delete player from queue and announce the removal
      delete client.worded.get(`${message.guild.id}`).players[message.author.id];
      return message.reply(`${emotes.toddSad} **${message.author.username}** has left the game.${newOwnerMsg}
**${Object.keys(client.worded.get(`${message.guild.id}`).players).length}** players remain.`);
    }
    
    if (args[0] === "stop") {
      if (!guildGameObj) return message.reply(`${emotes.todd} There're no active games.`);
      
      if (guildGameObj.owner !== message.author.id) return message.reply(`${emotes.todd} You're not **${guildGameObj.ownerName}** the game owner, so you can't stop this game. Keep rolling, y'all!`);

      // stops the game
      if (!guildGameObj.gameCollector.ended) await guildGameObj.gameCollector.stop();
      client.worded.delete(`${message.guild.id}`);
      return message.reply(`${emotes.toddSad} Game stopped, get back home y'all... Maybe next time!`);
    }
    
    if (args[0] === "start" || args[0] === "play") {
      if (!(!guildGameObj)) {
        if (guildGameObj.status === 0) return message.reply(`${emotes.toddHappy} You're in luck, there's a game that's about to start! Type \`${prefix}${this.name} join\` to hop in!`);
        if (guildGameObj.status === 1) return message.reply(`${emotes.toddSad} Whoops, a game has already started.. Feel free to spectate, still!`);
      }

      // initiate the guildGameObj, set owner
      let exampleGuildObj = {
        "id": message.guild.id,
        "status": 0, // 0 = waiting, 1 = in progress
        "gameCollector": {},
        "gameChannel": {},
        "gameClient": {},
        "owner": message.author.id, // id of game starter
        "ownerName": message.author.username, // name of game starter
        "timestamp": [0, 0], // [0] = start, [1] = end
        "wordsUsed": [],
        "round": 0,
        "settings": {
          "intOnly": ["starthp", "minwordlength", "timelimit", "timepoison", "maxrules"],
          "desc": {
            "startHP": {
              "desc": "starting HP amount. Go below 1 and you're out!",
            },
            "minWordLength": {
              "desc": "every word shorter than this won't show up, nor be counted.",
            },
            "timeLimit": {
              "desc": "seconds to come up with a word before being skipped",
            },
            "timePoison": {
              "desc": "lose this much HP if player doesn't respond on time",
            },
            "maxRules": {
              "desc": "maximum amount of rules per word/round, max possible is 9",
            }
          },
          "gamemode": "worded",
          "startHP": 150,
          "minWordLength": 3,
          "timeLimit": 15,
          "timePoison": 0,
          "maxRules": 9
        },
        "standings": [],
        // because we'll add 1 before every round, owner always start first
        "currentPos": -1,
        "currentSuccess": false,
        "players": {}
      };
      
      client.worded.set(`${message.guild.id}`, exampleGuildObj);
      guildGameObj = client.worded.get(`${message.guild.id}`);
      message.reply(`${emotes.toddHappy} Let's get this show on the road!
> To join the game, please type \`${prefix}${this.name} join\`! You got 30 seconds!`);

      // send invitation, close signups in 60s
      const gameChannel = message.channel;
      const filter = (msg) => msg.content.startsWith(`${prefix}${this.name} join`);
      const collector = gameChannel.createMessageCollector({ filter, time: 30000 });
      guildGameObj.gameCollector = collector;
      guildGameObj.gameChannel = gameChannel;
      guildGameObj.gameClient = client;

      // the one starting the game automatically plays
      WordedGameManager.makePlayer(client, message.author, message.guild.id);
      // update to collection
      client.worded.set(`${message.guild.id}`, guildGameObj);

      // get all invited people
      collector.on('collect', (msg) => {
        let startingGameObj = client.worded.get(`${msg.guild.id}`);
        let playerObj = startingGameObj.players;
        if (startingGameObj.owner === msg.author.id) return msg.reply(`${emotes.toddHappy} You started the game, so you're automatically here!`);
      	if (!(!playerObj[`${msg.author.id}`])) return msg.reply(`${emotes.toddHappy} You've already joined. Sit tight!`);

        // adds new player to queue and announces the arrival
        WordedGameManager.makePlayer(client, msg.author, msg.guild.id);
        msg.reply(`${emotes.toddHappy} **${msg.author.username}** is in! We have **${Object.keys(playerObj).length}** players!`);
        
        // update to collection
        client.worded.set(`${message.guild.id}`, startingGameObj);
      });

      // either signup period ended, or the game stopped
      collector.on('end', async (collected) => {
        // signup period ended!
        if (client.worded.has(`${message.guild.id}`)) {
          let initiatingGameObj = client.worded.get(`${message.guild.id}`);
          let playerObj = initiatingGameObj.players;

          // there's only 1 player (aka. the owner)
          if (Object.keys(playerObj).length < 2) {
            // stops the game
            if (!initiatingGameObj.gameCollector.ended) await initiatingGameObj.gameCollector.stop();
            client.worded.delete(`${message.guild.id}`);
            return gameChannel.send(`${emotes.toddSad} We needed at least two players! The battle begrudgingly has to halt...`);
          }

          // change game status to playing
          initiatingGameObj.status = 1;
          initiatingGameObj.timestamp[0] = Date.now(); // starting timestamp
          
          // update to collection
          client.worded.set(`${message.guild.id}`, initiatingGameObj);

          // initiates the game
          gameChannel.send(`${emotes.todd} The battle begins! **${Object.keys(playerObj).length}** remain.`);
          WordedGameManager.startGame(client, client.worded.get(`${message.guild.id}`));
        }
      });
    }
	},
};