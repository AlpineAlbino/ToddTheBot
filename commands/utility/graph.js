const { prefix, emotes } = require('../../config.json');
const numUtils = require('../../utils/number.js');

const Discord = require('discord.js');
const Canvas = require('canvas');
const Color = require('color');
// graph
const Parser = require('expr-eval').Parser;

module.exports = {
  name: 'graph',
  alias: ['grapher'],
  description: `Graphs out your mathematical expressions.`,
  usage: {
    args: [
      {
        display: 'formula',
        description: 'flattened expression to graph. Wrap your formula in {brackets}.',
        type: 'text',
        optional: false
      },
      {
        display: 'homeCoordinateX;homeCoordinateY',
        description: 'from where should Todd graph your formula? Separate X and Y with ;',
        type: 'num;num',
        default: '0;0',
        optional: true
      },
      {
        display: 'scaleX',
        description: 'how many values can fit on the X axis? Default is 10',
        type: 'num',
        default: 10,
        optional: true
      },
      {
        display: 'scaleY',
        description: 'how many values can fit on the Y axis? Default is 10',
        type: 'num',
        default: 10,
        optional: true
      }
    ]
  },

  async execute(message, args) {
    // we have to remap arguments
    let fullCommand = args.join(" ");
    if (fullCommand.indexOf("{") < 0 || fullCommand.indexOf("}") < 0) return message.reply(`${emotes.todd} You must wrap your entire function in {brackets}.`);

    // and get the finalized arguments
    // only take the stuff inside the {}
    let funcText = fullCommand.substring(fullCommand.indexOf("{")+1, fullCommand.lastIndexOf("}"));
    let graphArgs = fullCommand.replace(`{${funcText}}`, "").trim().split(" ");

    // Create a 700x700 pixels canvas and get its context
  	// The context will be used to modify the canvas
  	const canvas = Canvas.createCanvas(1000, 1000);
  	const context = canvas.getContext('2d');

    // adds a point on the graph
    function plotPoint(cv, ctx, at, home=[0,0], scaleMax=[10,10], lineWidth=5, strokeColor="#000000") {
      // set line stroke and line width
      ctx.strokeStyle = strokeColor;

      // find gap between it and the polar core
      // divide by scaleMax by 2 (two sides)
      // translate to canvas size
      // minus canvas height since we start from up
      const canvasAt = [(canvas.width/2)*((at[0] - home[0])/(scaleMax[0]/2)), (canvas.height/2)*((at[1] - home[1])/(scaleMax[1]/2))];

      // and add canvas/2 to make it close to the polarCore
      ctx.strokeRect(canvasAt[0] + canvas.width/2, canvas.height - (canvasAt[1] + canvas.height/2), 0.01, 0.01);
    }

    // axis drawer
    function drawGrapherLine(cv, ctx, from, to, home=[0,0], scaleMax=[10,10], lineWidth=5, strokeColor="#000000") {
      // set line stroke and line width
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      // find gap between it and the polar core
      // divide by scaleMax by 2 (two sides)
      // translate to canvas size
      // minus canvas height since we start from up
      const canvasFrom = [(canvas.width/2)*((from[0] - home[0])/(scaleMax[0]/2)), (canvas.height/2)*((from[1] - home[1])/(scaleMax[1]/2))];
      const canvasTo = [(canvas.width/2)*((to[0] - home[0])/(scaleMax[0]/2)), (canvas.height/2)*((to[1] - home[1])/(scaleMax[1]/2))];

      // and add canvas/2 to make it close to the polarCore
      // pick two points and connect them
      ctx.beginPath();
      ctx.moveTo(canvasFrom[0] + canvas.width/2, canvas.height - (canvasFrom[1] + canvas.height/2));
      ctx.lineTo(canvasTo[0] + canvas.width/2, canvas.height - (canvasTo[1] + canvas.height/2));
      ctx.stroke();
    }

    function drawAxis(cv, ctx, at, home=[0,0], scaleMax=[10,10], lineWidth=5, strokeColor="#000000") {
      // set line stroke and line width
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      // draw waaaaay outside of the frame
      const edgeW = scaleMax[0] / 2;
      const edgeH = scaleMax[1] / 2;
      drawGrapherLine(canvas, context, [home[0] + edgeW, at[1]], [home[0] - edgeW, at[1]], home, scaleMax, lineWidth, strokeColor);
      drawGrapherLine(canvas, context, [at[0], home[1] + edgeH], [at[0], home[1] - edgeH], home, scaleMax, lineWidth, strokeColor);
    }

    // home
    const home = (!graphArgs[0]) ? [0, 0] : graphArgs[0].split(";");
    const homeNum = [numUtils.getNumber(home[0]), numUtils.getNumber(home[1])];
    if (homeNum[0] === false || homeNum[1] === false) return message.reply(`${emotes.todd} That's not a valid home coordinate.`);

    // other parameters
    const scaleX = (graphArgs[1]) ? numUtils.getNumber(graphArgs[1]) : 10;
    const scaleY = (graphArgs[2]) ? numUtils.getNumber(graphArgs[2]) : (graphArgs[1]) ? numUtils.getNumber(graphArgs[1]) : 10;
    const accuracy = 0.01; // add value every 0.01

    // draw the main axis
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawAxis(canvas, context, [0, 0], homeNum, [scaleX, scaleY]);

    // draw secondary axis
    // find horizontal and vertical edges
    const wEdge = [homeNum[0] - scaleX/2, homeNum[0] + scaleX/2];
    const hEdge = [homeNum[1] - scaleY/2, homeNum[1] - scaleX/2];
    // scalable factors
    const scalarsArr = [1, 2, 2.5, 5, 10];
    // we want at least 9 lines in total (could be more) so we divide the edge from home to get the gap
    // counting the main 0 line then we can have 4 on either side
    const distBetween2ndAxis = Math.abs(wEdge[0] - homeNum[0]) / 4;
    // shirnk the dist by powers of 10 until it reaches single digits
    const powerOf10 = Math.floor(Math.log10(distBetween2ndAxis));
    const reducedToScalar = distBetween2ndAxis / Math.pow(10, Math.floor(powerOf10));
    // sort it into the scalables and pick the one smaller than it, defaults to 0
    let scalablesToSort = [...scalarsArr, reducedToScalar].sort((a,b) => b-a);
    const chosenScalar = scalablesToSort[Math.max(0, scalablesToSort.lastIndexOf(reducedToScalar) - 1)];

    const minX = homeNum[0] - numUtils.getNumber(scaleX / 2) - 0.25;
    const maxX = homeNum[0] + numUtils.getNumber(scaleX / 2) + 0.25;
    
    function drawGraph (computableFunc, home, scaleMax, lineWidth, strokeColor) {
      const precision = 500;
      let prevDerivative = 0;
      let prevX = 0;

      for (let i = 0; i < precision; i++) {
        // calculate the first and next values
        let curX = minX + (maxX - minX)/precision * i;
        let nextX = minX + (maxX - minX)/precision * (i+1);
        let curY = computableFunc.evaluate({ x: curX });
        let nextY = computableFunc.evaluate({ x: nextX });

        // skip if we can't find values
        if (!curY && !nextY) continue;

        // if the derivative changes signs immediately then it "might" be an asymptote
        // could just be a local max/min
        let curDerivative = (nextY - curY)/(nextX - curX);
        if (curDerivative * prevDerivative >= 0) {
          drawGrapherLine(canvas, context, [curX, curY], [nextX, nextY], home, scaleMax, lineWidth, strokeColor);
        // Graphs more precisely around asymptotes. Fixes issue where lines that approach asymptotes suddenly cut off
        } else {
          // If curve approaches asymptote from left side
          if (Math.abs(prevDerivative) < Math.abs(curDerivative) || !curDerivative) {
            graphAroundAsymptote(computableFunc, curX, nextX, prevDerivative, 20, home, scaleMax, lineWidth, strokeColor);
          // If curve approaches asymptote from right side
          } else {
            graphAroundAsymptote(computableFunc, nextX, prevX, curDerivative, 20, home, scaleMax, lineWidth, strokeColor);
          }
          drawGrapherLine(canvas, context, [curX, curY], [nextX, curY], home, scaleMax, lineWidth, strokeColor);
        }
        prevDerivative = curDerivative;
        prevX = curX;
      }
    }

    // recursively graphs more accurately around asymptotes, fixes the issue where the curve suddenly cut off
    function graphAroundAsymptote(computableFunc, aX1, aX2, prevDerivative, depth, home, scaleMax, lineWidth, strokeColor) {
      let precision = 2;
      for (let j = 0; j < precision; j++) {
        let curX = aX1 + (aX2 - aX1) * j/precision;
        let nextX = aX1 + (aX2 - aX1) * (j + 1)/precision;
        let curY = computableFunc.evaluate({ x: curX });
        let nextY = computableFunc.evaluate({ x: nextX });
        let curDerivative = (nextY - curY)/(nextX - curX);
        // makes sure that when it is graphing around asymptotes, it doesn't accidently connect points through an asymptote
        if (curDerivative * prevDerivative >= 0) {
          drawGrapherLine(canvas, context, [curX, curY], [nextX, curY], home, scaleMax, lineWidth, strokeColor);
        } else {
          if (depth > 1) {
            graphAroundAsymptote(computableFunc, curX, nextX, prevDerivative, depth - 1, color);
          }
          return;
        }
        prevDerivative = curDerivative;
      }
    }
    
    
    // compute each value and slowly draw on the canvas by connecting dots
    // use scaleX to determine where to start, the axis are always in the middle so halve scaleX
    try {
      let funcParser = new Parser();
      let computableFunc = funcParser.parse(funcText);
    
      for (let i = homeNum[0] - numUtils.getNumber(scaleX / 2) - 0.25; i < homeNum[0] + numUtils.getNumber(scaleX / 2) + 0.25; i += accuracy) {
        // we don't know if it'll work, might be a user error
          const firstItr = [i, computableFunc.evaluate({ x: i })];
          plotPoint(canvas, context, firstItr, homeNum, [scaleX, scaleY], 5, "#ff0000");
      }
    } catch (error) {
      console.error(error);
      return message.reply(`${emotes.todd} That doesn't seem like a function I can compute. Try again:\n\`\`\`${error}\`\`\``);
    }

    // Use the helpful Attachment class structure to process the file for you
  	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'graph.png');
  	message.reply({files: [attachment]});
  },
};