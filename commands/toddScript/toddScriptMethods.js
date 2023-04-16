const { prefix, emotes } = require('../../config.json');
const numUtils = require('../../utils/number.js');
const strUtils = require('../../utils/string.js');
const miscUtils = require('../../utils/misc.js');
const arrUtils = require('../../utils/array.js');

const ToddScriptParser = require('./toddScriptParser.js');

module.exports = {
  name: 'toddScriptMethods',
  description: `Methods for ToddScript`,
  visible: false,

  getValueAndType(lineObj, tokenObj, checkValue, forceTypes = [], fallbackToString = false, forceVar = false) {
    let { line, row } = lineObj;
    let currentVar = {
      "value": "",
      "type": "",
      "locked": false
    };

    // variable check
    if (checkValue[0] === `.`) {
      currentVar = module.exports.toddConvertVar(0, lineObj, tokenObj, checkValue)[0];
    } else {
      // forceVar
      if (forceVar) {
        const errorContent = `argument "${checkValue}" must be variable`;
        return module.exports.toddYell(errorContent, "valueError", line, row);
      }
    }

    // float check
    if (numUtils.getNumber(checkValue) !== false) {
      currentVar.value = numUtils.getNumber(checkValue);
      currentVar.type = "num";
    }

    // int check
    if (numUtils.getInteger(checkValue) !== false) {
      currentVar.value = numUtils.getInteger(checkValue);
      currentVar.type = "int";
    }

    // string check
    if (checkValue[0] === `"`) {
      let checkQuote = strUtils.getOccurencesOf(checkValue, `"`);
      if (checkQuote < 2) {
        const errorContent = `str constructor missing closing quotation mark`;
        return module.exports.toddYell(errorContent, "valueError", line, row);
      }

      currentVar.value = checkValue.slice(1, checkValue.lastIndexOf(`"`));
      if (currentVar.value.charAt(0) === `.`) {
        const errorContent = `str constructor cannot start with .`;
        return module.exports.toddYell(errorContent, "valueError", line, row);
      }
      currentVar.type = "str";
    }

    // arr check
    if (checkValue[0] === `[`) {
      let checkQuote = strUtils.getOccurencesOf(checkValue, `]`);
      if (checkQuote < 1) {
        const errorContent = `arr constructor missing closing bracket mark`;
        return module.exports.toddYell(errorContent, "valueError", line, row);
      }

      const checkValueComma = checkValue.slice(1, checkValue.lastIndexOf(`]`)).replaceAll(" ", ",");
      currentVar.value = module.exports.toddConvertArr(lineObj, checkValueComma);
      currentVar.type = "arr";
    }

    // fallbacks to str
    if (currentVar.type.length < 1) {
      if (fallbackToString) {
        currentVar.value = checkValue;
        currentVar.type = "str";
      } else {
        // if undefined
        if (currentVar.value === undefined) {
          const errorContent = `access to undefined dump disallowed`;
          return module.exports.toddYell(errorContent, "valueError", line, row);
        }
        const errorContent = `value fallbacking to string disallowed`;
        return module.exports.toddYell(errorContent, "valueError", line, row);
      }
    }

    console.log(currentVar);
    // coerce type
    if (forceTypes.length > 0 && forceTypes.indexOf(currentVar.type) < 0) {
      const errorContent = `value must be of type ${forceTypes}`;
      return module.exports.toddYell(errorContent, "valueError", line, row);
    }

    return currentVar;
  },

  toddFillUndefined(message, lineObj, tokenObj, fillObj) {
    let { line, row } = lineObj;

    // if dump is empty throw error
    if (Object.keys(tokenObj.undefined).length < 1) {
      const errorContent = `undefined dump empty`;
      return module.exports.toddYell(errorContent, "dumpError", line, row);
    }

    // fill in the most recently added var and deletes it from dump
    let fillingVar = Object.keys(tokenObj.undefined)[0];
    tokenObj.vars[fillingVar] = fillObj;
    delete tokenObj.undefined[fillingVar];
    console.log(`filled and deleted ${fillingVar} from undefined dump`);
  },

  toddAssign(message, lineObj, tokenObj, edit, editTo) {
    let { line, row } = lineObj;

    const varToEdit = edit.slice(1);
    if (!tokenObj.vars[varToEdit]) {
      const errorContent = `unregistered variable "${edit}"`;
      return module.exports.toddYell(errorContent, "variableError", line, row);
    }
    return tokenObj.vars[varToEdit] = editTo;
  },

  toddNum(message, lineObj, tokenObj, value) {
    let { line, row } = lineObj;
    
    // if only one argument then it's to fill undefined
    if (!value[1]) {
      let checkValue = module.exports.getValueAndType(lineObj, tokenObj, value[0], ["num", "int"]);
      return module.exports.toddFillUndefined(message, lineObj, tokenObj, checkValue);
    }

    // if two then it's to edit the first value
    if (!value[2]) {
      let editValue = module.exports.getValueAndType(lineObj, tokenObj, value[0], ["num", "int"], false, true);
      // second value must be number
      let editToValue = module.exports.getValueAndType(lineObj, tokenObj, value[1], ["num", "int"], false);

      return module.exports.toddAssign(message, lineObj, tokenObj, value[0], editToValue);
    }
  },

  toddConvertVar(message, lineObj, tokenObj, value, forceVar = false) {
    value = arrUtils.arrayify(value);
    let { line, row } = lineObj;

    let checkedVar = value.map(val => module.exports.toddCheckVar(lineObj, tokenObj, val, forceVar));
    return checkedVar;
  },

  toddConvertArr(lineObj, value) {
    let { line, row } = lineObj;

    try {
      return JSON.parse("[" + value + "]");
    }
    catch (error) {
      const errorContent = `arr constructor invalid`;
      return module.exports.toddYell(errorContent, "valueError", line, row);
    }
  },

  toddCheckVar(lineObj, tokenObj, variableStr, forceVar = false) {
    const { line, row } = lineObj;

    // if value starts with . it's a var
    if (variableStr[0] === ".") {
      const checkVar = variableStr.slice(1);
      if (!tokenObj.vars[checkVar]) {
        const errorContent = `unregistered variable "${checkVar}"`;
        return module.exports.toddYell(errorContent, "variableError", line, row);
      }

      return tokenObj.vars[checkVar];
    } else {
      if (forceVar) {
        const errorContent = `unregistered variable "${checkVar}" in concat`;
        return module.exports.toddYell(errorContent, "variableError", line, row);
      }
      return variableStr;
    }
  },

  toddTalk(message, lineObj, tokenObj, value) {
    let { line, row } = lineObj;

    let capturedStr = strUtils.getSplitOnQuotes(value.join(" "));
    let returnArr = module.exports.toddConvertVar(message, lineObj, tokenObj, capturedStr, false);

    // undefined values mustn't be passed to text
    if (returnArr.length < 1) {
      const errorContent = `returning message mustn't be empty`;
      return module.exports.toddYell(errorContent, "sendError", line, row);
    }

    if (returnArr.includes(undefined)) {
      const errorContent = `variable in undefined dump`;
      return module.exports.toddYell(errorContent, "variableError", line, row);
    }

    // strip values only
    let returnStripped = returnArr.map(item => {
      return miscUtils.isObject(item) ? item.value : item;
    })
    return message.channel.send(`${returnStripped.join("")}`);
  },

  toddYell(errorContent, type, line, row, col) {
    throw `(${row + 1}${!col ? "" : ":"+col}) <${type}> ${errorContent}
${line}`;
  },

  toddMake(message, lineObj, tokenObj, value) {
    let { line, row } = lineObj;

    const varName = value[0];
    // variable names must be uppercased
    if (!/^[A-Z\_]+$/g.test(varName)) {
      const errorContent = `variable "${varName}" must be uppercase letters or underscore only`;
      return module.exports.toddYell(errorContent, "nameError", line, row);
    }

    // initialize variable
    tokenObj.vars[varName] = {
      "type": "",
      "value": undefined,
      "locked": false
    };

    console.log(!value[1]);
    if (!value[1]) {
      // if no value is given push it to the undefined dump
      tokenObj.undefined[varName] = {
        "type": "",
        "value": undefined,
        "locked": false
      };
    } else {
      const checkValue = value.slice(1).join(" ");
      tokenObj.vars[varName] = module.exports.getValueAndType(lineObj, tokenObj, checkValue, [], true);
    }
  }
};