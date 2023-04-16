const arrUtils = require('./array.js');

module.exports = {
	name: 'colorUtils',
  description: `Color utilities`,

  rgbArrayToHex (input) {
    const rgbRound = arrUtils.roundArr(input);
    const rgbString = `rgb(${rgbRound[0]}, ${rgbRound[1]}, ${rgbRound[2]})`;
    const hexString = Color(rgbString).hex();
    return hexString;
  },

  getHex (input) {
    let returnHex = "";
    let checkHex = "";
    checkHex = (input.charAt(0) === "#") ? input.substring(1) : input;
    checkHex = checkHex.toUpperCase();
    
    // check if all characters are in hex
    const hexValid = "0123456789ABCDEF";
    const validLengths = [1, 2, 3, 4, 6, 8];

    if (validLengths.indexOf(checkHex.length) < 0) throw new Error(`${checkHex} is not a valid hex.`);
    
    for (let i = 0; i < checkHex.length; i++) {
      if (hexValid.indexOf(checkHex[i]) < 0) {
        throw new Error(`${checkHex} is not a valid hex.`);
      }
    }

    if (checkHex.length === 1) returnHex = checkHex.repeat(6);
    if (checkHex.length === 2) returnHex = checkHex.repeat(3);
    if (checkHex.length === 3) returnHex = `${checkHex[0].repeat(2)}${checkHex[1].repeat(2)}${checkHex[2].repeat(2)}`;
    if (checkHex.length === 4) returnHex = `${checkHex[0].repeat(2)}${checkHex[1].repeat(2)}${checkHex[2].repeat(2)}${checkHex[3].repeat(2)}`;
    if (checkHex.length === 6) returnHex = checkHex;
    if (checkHex.length === 8) returnHex = checkHex;
    
    return (returnHex.length < 1) ? false : `#${returnHex}`;
  },

  getRandomHex (count=1) {
    const available = "0123456789abcdef";
    let returnHex = [];
    
    for (let i = 0; i < count; i++) {
      let hex = "#";
      for (let j = 0; j < 6; j++) {
        hex += available[Math.floor(Math.random() * available.length)];
      }
      returnHex.push(hex);
    }

    return (count === 1) ? returnHex[0] : returnHex;
  },
}