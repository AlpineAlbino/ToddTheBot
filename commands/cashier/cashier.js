const { prefix, emotes } = require('../../config.json');

const Discord = require('discord.js');
const CashierGameManager = require('./cashierGameManager.js');

module.exports = {
	name: 'cashier',
  alias: ["cash", "money"],
	description: `ready your eyes, and be the fastest cashier in the town!`,
  visible: false,
  guildOnly: true,
  cooldown: 3,
  usage: {},
  
	async execute(message, args) {
    // fetches the cashier Collection of the guild
    const client = message.client;
    let guildGameObj = client.cashier.get(`${message.guild.id}`);

    if (args[0] === "start" || args[0] === "play") {
      // if there's already a game existing, tell the user to join, or spectate
      if (!(!guildGameObj)) {
        if (guildGameObj.status === 0) return message.reply(`${emotes.toddHappy} You're in luck, there's a game that's about to start! Type \`${prefix}${this.name} join\` to hop in!`);
        if (guildGameObj.status === 1) return message.reply(`${emotes.toddSad} Whoops, a game has already started.. Feel free to spectate, still!`);
      }

      // if not, initiate the guildGameObj, set owner
      let defaultGuildObj = {
        "id": message.guild.id,
        "status": 0, // 0 = waiting, 1 = in progress
        "gameCollector": {},
        "gameChannel": {},
        "gameClient": client,
        "owner": message.author.id, // id of game starter
        "ownerName": message.author.username, // name of game starter
        "timestamp": [0, 0], // [0] = start, [1] = end
        "round": 0,
        "players": {} // it's easier to access objects than arrays
      };

      // and update the Collection
      client.cashier.set(`${message.guild.id}`, defaultGuildObj);
      guildGameObj = client.cashier.get(`${message.guild.id}`);

      // send invitation, close signups in 30s
      message.reply(`${emotes.toddHappy} Let's get this show on the road!
> To join the game, please type \`${prefix}${this.name} join\`! You got 30 seconds!`);

      // only fetch people who send 'join'
      const gameChannel = message.channel;
      const filter = (msg) => msg.content.startsWith(`${prefix}${this.name} join`);
      const collector = gameChannel.createMessageCollector({ filter, time: 30000 });
      guildGameObj.gameCollector = collector;
      guildGameObj.gameChannel = gameChannel;

      // the one starting the game automatically plays
      CashierGameManager.makePlayer(client, message.author, message.guild.id);
      // update to collection
      client.cashier.set(`${message.guild.id}`, guildGameObj);

      // get people who sent 'join'
      collector.on('collect', (msg) => {
        let startingGameObj = client.cashier.get(`${msg.guild.id}`);
        let playerObj = startingGameObj.players;

        // only new players are added to the Collection
        if (startingGameObj.owner === msg.author.id) return msg.reply(`${emotes.toddHappy} You started the game, so you're automatically here!`);
      	if (!(!playerObj[`${msg.author.id}`])) return msg.reply(`${emotes.toddHappy} You've already joined. Sit tight!`);

        // adds new players to queue and announces arrival
        CashierGameManager.makePlayer(client, msg.author, msg.guild.id);
        msg.reply(`${emotes.toddHappy} **${msg.author.username}** is in! We have **${Object.keys(playerObj).length}** players!`);
        
        // update to collection
        client.cashier.set(`${message.guild.id}`, startingGameObj);
      });

      // either signup period ended, or the game stopped
      collector.on('end', async (collected) => {
        // check if Collection for guild exists
        if (client.cashier.has(`${message.guild.id}`)) {
          let initiatingGameObj = client.cashier.get(`${message.guild.id}`);
          let playerObj = initiatingGameObj.players;

          // if there's only 1 player (aka. the owner)
          if (Object.keys(playerObj).length < 2) {
            // stops the game
            if (!initiatingGameObj.gameCollector.ended) await initiatingGameObj.gameCollector.stop();
            client.cashier.delete(`${message.guild.id}`);
            return gameChannel.send(`${emotes.toddSad} We needed at least two players! The battle begrudgingly has to halt...`);
          }

          // if there is >= 2 people, change game status to playing
          initiatingGameObj.status = 1;
          initiatingGameObj.timestamp[0] = Date.now(); // starting timestamp
          
          // update to collection
          client.cashier.set(`${message.guild.id}`, initiatingGameObj);

          // initiates the game
          gameChannel.send(`${emotes.todd} The battle of the greatest cashier begins! **${Object.keys(playerObj).length}** remain.`);
          CashierGameManager.startGame(client, client.cashier.get(`${message.guild.id}`));
        }
      });
    }
    
	},
};