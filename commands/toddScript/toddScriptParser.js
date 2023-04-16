const { prefix, emotes } = require('../../config.json');
const TSMethods = require('./toddScriptMethods.js');

module.exports = {
	name: 'toddScriptParser',
	description: `Parser for ToddScript`,
  visible: false,

  checkVar (lineObj, tokenObj, variableStr) {
    const {line, row} = lineObj;

    // if value starts with . it's a var
    if (variableStr[0] === ".") {
      const checkVar = variableStr.slice(1);
      if (!tokenObj.vars[checkVar]) {
        const errorContent = `unregistered variable "${checkVar}"`;
        return TSMethods.toddYell(errorContent, "variableError", line, row);
      }
      console.log(tokenObj.vars[checkVar]);
      return tokenObj.vars[checkVar].value;
    } else {
      return variableStr;
    }
  },

  parseSyntax (lineObj) {
    const {line, row} = lineObj;
    console.log(line, row);
    
    if (line.slice(-1) !== ";") {
      let errorContent = `no semicolon at line end`;
      return TSMethods.toddYell(errorContent, "syntaxError", line, row);
    }
    
    const open = ["(", "[", "<"];
    const close = [")", "]", ">"];

    let openedBrackets = "";
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (open.indexOf(char) < 0 || close.indexOf(char) < 0) continue;

      let openOrClose = open.indexOf(char) >= 0;
      // if an open bracket, add to the queue
      if (openOrClose) {
        openedBrackets += char;
      } else {
        // if close bracket, find the latest open bracket and match
        let matchingOpenBracket = openedBrackets.slice(-1);

        // if it doesn't match throw error
        if (close[open.indexOf(matchingOpenBracket)] !== char) {
          let errorContent = `unmatched bracket`;
          return TSMethods.toddYell(errorContent, "syntaxError", line, row, i);
        } else {
          // if it does then remove the bracket and move on
          openedBrackets.slice(0, -1);
        }
      }
    }

    // if everything's fine return ok
    return true;
  },

  parseToken (message, lineObj, tokenObj, method, value) {
    const {line, row} = lineObj;

    if (!value[0]) {
      let errorContent = `methods' arguments cannot be empty`;
      return TSMethods.toddYell(errorContent, "methodError", line, row, i);
    }
    
    switch (method) {
      case "toddComment":
        break;
        
      case "toddTalk":
        TSMethods.toddTalk(message, lineObj, tokenObj, value);
        break;
        
      case "toddMake":
        TSMethods.toddMake(message, lineObj, tokenObj, value);
        break;
        
      case "toddNum":
        TSMethods.toddNum(message, lineObj, tokenObj, value);
        break;
    }
  },
  
	parse (message, program) {
    let perLines = program.split("\n");

    let fullParseTokens = {
      "undefined": {},
      "vars": {}
    };
    
    for (let i = 0; i < perLines.length; i++) {
      const line = i;
      let lineObj = {
        "line": perLines[line],
        "row": line
      }

      // ignore blank lines
      if (lineObj.line.length < 1) continue;
      
      // test brackets and semicolons
      module.exports.parseSyntax(lineObj);

      // remove the semicolon at the end
      lineObj.line = lineObj.line.slice(0, -1);
      // method obj1 operator obj2;
      const splitLine = lineObj.line.split(" ");
      const [method, ...value] = splitLine;
      module.exports.parseToken(message, lineObj, fullParseTokens, method, value);
    }
	},
};