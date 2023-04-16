const { prefix, emotes } = require('../../config.json');
const numUtils = require('../../utils/number.js');
const colorUtils = require('../../utils/color.js');

const Discord = require('discord.js');
const Canvas = require('canvas');
const Color = require('color');
const fs = require('fs');

module.exports = {
	name: 'place',
  guildOnly: true,
  alias: [],
	description: `r/place, but mini! Commence the artfight!`,
  cooldown: 15,
  usage: {
    args: [
      {
        display: 'location',
        description: 'the square you want to paint on',
        type: 'A1-notation',
        optional: true
      }
    ]
  },
  
	async execute(message, args) {
    // Create a 700x700 pixels canvas and get its context
  	// The context will be used to modify the canvas
  	const canvas = Canvas.createCanvas(700, 700);
  	const context = canvas.getContext('2d');

    const newGuild = !fs.existsSync(`./canvas/${message.guild.id}.png`);
    
    // show the board
    if (!args[0]) {
      const guildCanvas = await Canvas.loadImage((newGuild) ? `https://media.discordapp.net/attachments/985799298006528030/1002253815946416358/rulerBase.png` : `./canvas/${message.guild.id}.png`);
      context.drawImage(guildCanvas, 0, 0, canvas.width, canvas.height);
      
      const gridGuide = await Canvas.loadImage(`https://media.discordapp.net/attachments/985799298006528030/1002251359078322336/rulerBase.png`);
      context.drawImage(gridGuide, 0, 0, canvas.width, canvas.height);
      // Use the helpful Attachment class structure to process the file for you
  	  const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `rulerBase.png`);
    	return message.reply({
        content: (newGuild) ? `${emotes.toddHappy} Welcome to the guild's board! Go grab one of my paintbrushes, and see what you can do with \`${prefix}help place!\`` : `${emotes.todd} Here's your board.`,
        files: [attachment]
      });
    }

    if (args[0] === "raw") {
      if (newGuild) return message.reply(`${emotes.todd} Your guild doesn't got one board yet. Paint on something with \`${prefix}place\`.`);

      const guildCanvas = await Canvas.loadImage(`./canvas/${message.guild.id}.png`);
      context.drawImage(guildCanvas, 60, 60, 640, 640, 0, 0, 640, 640);

      const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `rulerBase.png`);
    	return message.reply({files: [attachment]});
    }

    if (!args[1]) return message.reply(`${emotes.todd} Include the coordinate, and the hex code.`);

    // input coordinates
    const columns = "abcdefghijklmnop";
    const column = columns.indexOf(args[0].charAt(0).toLowerCase()) + 1;
    const row = numUtils.getInteger(args[0].substring(1));

    if (column < 1 || row === false) return message.reply(`${emotes.todd} Make sure you're inputting it in A1 format: columns first, row after. Columns are from A to P, and rows are from 1 to 16.`);
    if (row < 1 || row > 16) return message.reply(`${emotes.todd} Rows can only be from 1 to 16.`);

    // input color
    const hexCheck = colorUtils.getHex(args[1]);
    if (hexCheck === false) return message.reply(`${emotes.todd} \`${args[1]}\` isn't a valid hex code.`);

    // draw on board
    const guildCanvas = await Canvas.loadImage((newGuild) ? `https://media.discordapp.net/attachments/985799298006528030/1002253815946416358/rulerBase.png` : `./canvas/${message.guild.id}.png`);
    context.drawImage(guildCanvas, 0, 0, canvas.width, canvas.height);
    context.fillStyle = `${hexCheck}`;
    context.fillRect(60 + 40*(column-1), 60 + 40*(row-1), 40, 40);

    const buffer = canvas.toBuffer();
    fs.writeFile(`./canvas/${message.guild.id}.png`, buffer, function (error) {
      if (error) {
        return message.reply(`${emotes.toddYell} Hunker down! Board broke! Board broke!\`\`\`${error}\`\`\``);
      }
    })

    // grid on top
    const gridGuide = await Canvas.loadImage(`https://media.discordapp.net/attachments/985799298006528030/1002251359078322336/rulerBase.png`);
    context.drawImage(gridGuide, 0, 0, canvas.width, canvas.height);

    // Use the helpful Attachment class structure to process the file for you
    const bufferSend = canvas.toBuffer();
    const attachment = new Discord.MessageAttachment(bufferSend, `rulerBase.png`);
  	message.reply({
      content: (newGuild) ? `${emotes.toddHappy} And here's the guild's board! Go and create amazing artworks!` : `${emotes.toddHappy} Painted on ${args[0].toUpperCase()}!`,
      files: [attachment]
    });
	},
};