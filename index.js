// external packages
const fs = require('fs');
const Discord = require('discord.js');
const process = require('process');

// native files
const { prefix, emotes } = require('./config.json');
const discUtils = require('./utils/disc.js');
const keepAlive = require("./server.js");

// detect presences, members, messages and reactions
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_BANS, Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.GUILD_WEBHOOKS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.DIRECT_MESSAGES]
});

// command cooldowns
client.cooldowns = new Discord.Collection();

// games need their own Collections
client.worded = new Discord.Collection();
client.cashier = new Discord.Collection();
client.bp = new Discord.Collection();
client.typeTest = new Discord.Collection();

// commands (execute, read info, etc.)
client.commands = new Discord.Collection();
const commandFolders = fs.readdirSync('./commands');

// pull out commands from respective folders and add them to Todd
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  }
}

// we're rolling!
client.once('ready', () => {
  console.log('Ready!');

  const pingerInterval = setInterval(pinger, 60 * 5 * 1000); // console logs every five minutes to keep it alive
  function pinger() {
    const message = `Still here, uptime ${Math.floor(process.uptime())}`;
    console.log(message);
    let logChannel = discUtils.getChannel(client, "", "985799298006528030");
    logChannel.send(message);
  }
});

// whenever a message is sent
client.on('messageCreate', message => {
  // check if it has prefix, in DMs, or not from a bot: we don't take these
  if (!message.content.startsWith(`${prefix}`) || message.author.bot || message.channel.type === "DM") return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.alias && cmd.alias.includes(commandName));
  if (!command) return;

  // check if user is RAVEN
  if (command.ownerOnly && message.author.id !== '642307176228061184') return message.reply(`${emotes.toddYell} H- hey! You're not Raven! Hand over my revolver!`);

  // cooldown check
  if (message.author.id !== '642307176228061184') {
    const { cooldowns } = client;
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`${emotes.toddSurprised} Slow down, chief, those bullets can only be reloaded in **${timeLeft.toFixed(1)}s**.`);
      }
    }
    timestamps.set(message.author.id, now);
  }

  // check bot perms
  const botPerms = command.botPerms || [];
  const botMissingPerms = discUtils.checkPerms(message.guild.me, botPerms);
  if (botMissingPerms.length > 0) return message.reply(`${emotes.toddSad} huh, I'm missing some willpower to fire this revolver:\n${botMissingPerms.join(", ")}`);

  // check user perms
  const userPerms = command.userPerms || [];
  const userMissingPerms = discUtils.checkPerms(message.member, userPerms);
  if (userMissingPerms.length > 0) return message.reply(`${emotes.toddSad} huh, fill these in first, and you'll be ready:\n${userMissingPerms.join(", ")}`);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply(`${emotes.toddSad} My revolver got jammed, can't execute that command!\`\`\`${error}\`\`\``);
  }

});

// keep my baby alive
keepAlive();
client.login(process.env.TOKEN);
