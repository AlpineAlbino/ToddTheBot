const Canvas = require('canvas');
const Interpolate = require('color-interpolate');
const Color = require('color');

module.exports = {
	name: 'canvaUtils',
  description: `Canvas.js utilities`,

  generateColorBand (colors, viewHex=false) {
    const steps = colors.length;
    const canvasWidth = (steps < 5) ? 70 * steps : 700;

    let canvas = Canvas.createCanvas(canvasWidth, 140);
    const context = canvas.getContext('2d');
    
    const colorWidth = canvas.width / steps;
    context.textAlign = "center";
    context.textBaseline = "middle";
    // make color stops
    for (let i = 0; i < steps; i++) {
      const color = colors[i];
      context.fillStyle = color;
      // add an extra pixel to cover unwanted gaps
      context.fillRect(colorWidth * i, 0, colorWidth+1, canvas.height);

      if (viewHex) {
        // rotate the canvas to add text
        const hexConvert = Color(color).hex();
        context.fillStyle = (Color(color).luminosity() < 0.4) ? "#ffffff" : "#000000";
        context.save();
        context.translate(0, canvas.height);
        context.rotate(-Math.PI / 2);
        context.font = this.applyText(canvas, canvas.height * 4/5, hexConvert, "Verdana");
        context.fillText(`${hexConvert}`, canvas.height / 2, colorWidth * (i+0.5));
        context.restore();
      }
    }

    return canvas;
  },

  applyText (canvas, width, text, font) {
    const context = canvas.getContext('2d');
  	// Declare a base size of the font
  	let fontSize = 100;
  
  	do {
  		// Assign the font to the context and decrement it so it can be measured again
  		context.font = `${fontSize -= 2}px ${font}`;
  		// Compare pixel width of the text to the canvas minus the approximate avatar size
  	} while (context.measureText(text).width > width);
  
  	// Return the result to use in the actual canvas
  	return context.font;
  },
}