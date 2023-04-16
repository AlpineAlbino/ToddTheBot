const { prefix, emotes } = require('../../config.json');
const numUtils = require('../../utils/number.js');
const colorUtils = require('../../utils/color.js');
const canvasUtils = require('../../utils/canvas.js');

const Discord = require('discord.js');
const Canvas = require('canvas');
const Interpolate = require('color-interpolate');
const Color = require('color');

module.exports = {
	name: 'gradient',
  alias: [],
	description: `Maps a gradient full of colors for you! Time to show my artistic abilities!`,
  usage: {
    separator: "",
    args: [
      {
        display: 'steps',
        description: `for gradients with steps, useful for palettes (max 20), add 'n' after the number to view hex codes`,
        type: 'int',
        limit: [3, 20],
        optional: true
      },
      {
        display: 'color1',
        description: '1st color',
        type: 'hex',
        optional: false
      },
      {
        display: 'color2',
        description: '2nd color',
        type: 'hex',
        optional: false
      },
      {
        display: 'colors',
        description: 'additional colors',
        type: 'hex',
        optional: true,
        repeatable: true
      }
    ]
  },
  
	async execute(message, args) {
    if (!args[1]) return message.reply(`${emotes.todd} You ought to input at least two colors, like.. #ff0000 and #ffff00. Those are my favorite.`);

    // steps check
    let steps = 0;
    let viewHex = (args[0].slice(-1) === "n");
    if (args.length > 2) {
      const stepCheck = (viewHex) ? numUtils.getInteger(args[0].slice(0, -1)) : numUtils.getInteger(args[0]);
      if (stepCheck !== false) {
        if (stepCheck > 2 && stepCheck < 21) {
          steps = stepCheck;
          args.shift();
        }
      }
    }
    
    let colors = [];
    for (let i = 0; i < args.length; i++) {
      const hex = colorUtils.getHex(args[i]);
      if (hex === false) return message.reply(`${emotes.todd} \`${args[i]}\` is unfortunately an invalid hex code.`);

      colors.push(`${hex}`);
    }
    
  	let canvas = Canvas.createCanvas(700, 700/5);
  	const context = canvas.getContext('2d');

    if (steps === 0) {
      const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  
      // make color stops
      for (let i = 0; i < colors.length; i++) {
        const percent = 1 / (colors.length - 1) * i;
        gradient.addColorStop(percent, `${colors[i]}`);
      }
    	context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      let colormap = Interpolate(colors);
      let colorArr = [];
      
      // make color stops
      for (let i = 0; i < steps; i++) {
        const percent = 1 / (steps - 1) * i;
        const stepColor = colormap(percent);
        colorArr.push(Color(stepColor).hex());
      }

      canvas = canvasUtils.generateColorBand(colorArr, viewHex);
    }
    
    // Use the helpful Attachment class structure to process the file for you
  	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'gradient.png');
  	message.reply({files: [attachment]});
	},
};