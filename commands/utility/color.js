const { prefix, emotes, blindTypes } = require('../../config.json');
const fs = require('fs');
const Utils = require('../../utils.js');
const numUtils = require('../../utils/number.js');
const arrUtils = require('../../utils/array.js');
const colorUtils = require('../../utils/color.js');
const canvasUtils = require('../../utils/canvas.js');

const Discord = require('discord.js');
const Canvas = require('canvas');
const Interpolate = require('color-interpolate');
const Color = require('color');
const Blinder = require('color-blind');

module.exports = {
	name: 'color',
  alias: [],
	description: `Handles viewing and manipulating colors!`,
  usage: {
    separator: "",
    args: [
      {
        display: 'task',
        description: `what you want TODD to do with your colors
>    *'random [amount]'*: generates a random color, you can specify amounts and add 'n' afterwards for hex codes
>    *'blind {blindness} {colors...}'*: view colors in a colorblind filter
>    *'shade/tint/tone {color} [amount]'*: generates a color swatch with black/white/grey, you can specify amounts and add 'n' afterwards for hex codes`,
        type: 'text',
        dependable: true
      },
      {
        display: 'colors',
        description: 'additional colors',
        type: 'hex',
        dependable: true,
        repeatable: true
      }
    ]
  },
  
	async execute(message, args) {
    if (!args[0]) return message.reply(`${emotes.todd} You should include one color for viewing.`);

    const colorblindTypes = ["protanomaly", "protanopia", "deuteranomaly", "deuteranopia", "tritanomaly", "tritanopia", "achromatomaly", "achromatopsia"];
    if (colorblindTypes.indexOf(args[0].toLowerCase()) >= 0 || args[0] === "blind") {
      if (args[0] === "blind" || !args[1]) {
        const msgArr = [];
        for (let i = 0; i < colorblindTypes.length; i++) {
          const blindType = colorblindTypes[i];
          msgArr.push(`> **${blindType}**: ${blindTypes[blindType]}`);
        }
        return message.reply(`${emotes.todd} Here are the available colorblind filters. Use them with \`${prefix}${this.name} {blindType} {color1} [colors...]\`.
${msgArr.join('\n')}`);
      }
      
      if (args.length > 21) return message.reply(`${emotes.toddSurprised} Well, that's a lot of colors. Maximum is 20, please.`);
      
      const blindType = args.shift().toLowerCase(); // remove blind type from arr
      let normalColorArr = [];
      let blindColorArr  = [];
      for (let i = 0; i < args.length; i++) {
        const checkHex = colorUtils.getHex(args[i]);
        if (checkHex === false) return message.reply(`${emotes.todd} \`${args[i]}\` is not a valid hex.`);

        let blindHex = "";
        normalColorArr.push(checkHex);
        switch (blindType) {
          case "protanomaly":
            blindHex = Blinder.protanomaly(checkHex);
            break;
          case "protanopia":
            blindHex = Blinder.protanopia(checkHex);
            break;
          case "deuteranomaly":
            blindHex = Blinder.deuteranomaly(checkHex);
            break;
          case "deuteranopia":
            blindHex = Blinder.deuteranopia(checkHex);
            break;
          case "tritanomaly":
            blindHex = Blinder.tritanomaly(checkHex);
            break;
          case "tritanopia":
            blindHex = Blinder.tritanopia(checkHex);
            break;
          case "achromatomaly":
            blindHex = Blinder.achromatomaly(checkHex);
            break;
          case "achromatopsia":
            blindHex = Blinder.achromatopsia(checkHex);
            break;
        }
        blindColorArr.push(blindHex);
      }

      let canvasNormal = canvasUtils.generateColorBand(normalColorArr, true);
      let canvasBlind = canvasUtils.generateColorBand(blindColorArr, true);
      
      const normal = new Discord.MessageAttachment(canvasNormal.toBuffer(), `normal.png`);
      const blind = new Discord.MessageAttachment(canvasBlind.toBuffer(), `${blindType}.png`);
  	  return message.reply({content: `**${blindType.toUpperCase()}**`, files: [normal, blind]});
    }
    
    if (args[0] === "random" && !(!args[1])) {
      // count check
      let viewHex = (args[1].slice(-1) === "n");
      const stepCheck = (viewHex) ? numUtils.getInteger(args[1].slice(0, -1)) : numUtils.getInteger(args[1]);
      if (stepCheck === false || stepCheck < 2 || stepCheck > 20) return message.reply(`${emotes.todd} Number of random colors must be an integer in \`[2, 20]\`.`);
      
      const count = stepCheck;
      const colorArr = colorUtils.getRandomHex(count);
      let canvas = canvasUtils.generateColorBand(colorArr, viewHex);

      const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `${args[0]}.png`);
  	  return message.reply({files: [attachment]});
    }

    if (args[0] === "shade" || args[0] === "tint" || args[0] === "tone") {
      if (!args[1]) return message.reply(`${emotes.todd} You should include one color to view its shades, tints or tones.`);

      // count check
      let viewHex = (args[1].slice(-1) === "n");
      if (viewHex && !args[2]) return message.reply(`${emotes.todd} You should include a color in order to view its shades, tints, or tones.`);
      
      if (steps === false || steps < 2 || steps > 20) return message.reply(`${emotes.todd} Number of steps must be an integer in \`[2, 20]\`.`);
      
      const startHex = (!args[2]) ? colorUtils.getHex(args[1]) : colorUtils.getHex(args[2]);
      if (startHex === false) return message.reply(`${emotes.todd} That's an invalid hex.`);
      steps = (!args[2]) ? 10 : steps;
      
      const colorMix = (args[0] === "shade") ? "#000000" : (args[0] === "tint") ? "#ffffff" : "#808080";
      const colorBand = [startHex, colorMix];
      let colormap = Interpolate(colorBand);
      let colorArr = [];
      // make color stops
      for (let i = 0; i < steps; i++) {
        const percent = 1 / (steps - 1) * i;
        const stepColor = colormap(percent);
        colorArr.push(Color(stepColor).hex());
      }
      let canvas = canvasUtils.generateColorBand(colorArr, viewHex);

  	  const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `${args[0]}.png`);
  	  return message.reply({files: [attachment]});
    };

    // normal color viewing
    const viewHex = (args[0] === "random" && !args[1]) ? colorUtils.getHex(colorUtils.getRandomHex()[0]) : colorUtils.getHex(args[0]);
    if (viewHex === false) return message.reply(`${emotes.todd} \`${args[0]}\` is an invalid hex.`);
    const color = Color(viewHex);
    const rgb = arrUtils.arrRound(color.rgb().array());
    const hsl = arrUtils.arrRound(color.hsl().array());
    const cmyk = arrUtils.arrRound(color.cmyk().array());
    
    const msg = `${viewHex}\nRGB: ${rgb}\nHSL: ${hsl}\nCMYK: ${cmyk}\nINT: ${color.rgbNumber()}`;
    const canvas = Canvas.createCanvas(560, 280);
  	const context = canvas.getContext('2d');
    context.fillStyle = viewHex;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = (color.luminosity() < 0.5) ? "#ffffff" : "#000000";
    context.textBaseline = 'top';
    context.font = `35px Verdana`;
    context.fillText(`${msg}`, 20, 20);

    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `${args[0]}.png`);
  	return message.reply({files: [attachment]});
	},
};