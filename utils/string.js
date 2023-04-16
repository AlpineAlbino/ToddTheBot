module.exports = {
	name: 'stringUtils',
  description: `String utilities`,

  strAddAt (ogString, index, toAdd) {
    return ogString.slice(0, index) + toAdd + ogString.slice(index);
  },
  
  getSplitOnQuotes (str) {
    // the parenthesis in the regex creates a captured group within the quotes
    const quotesRegex = /[^\s"]+|"([^"]*)"/gi;
    let returnArr = [];
    let match;
    do {
      // each call returns the next regex match as an array
      match = quotesRegex.exec(str);
      if (match != null) {
        // index 1 in the array is the captured group if it exists
        // index 0 is the matched text, which we use if no captured group exists
        returnArr.push(match[1] ? match[1] : match[0]);
      }
    } while (match != null);
    return returnArr;
  },
  
  getOccurencesOf (str, check) {
    return str.split(check).length - 1;
  },

  getUniqueString (str) {
    return [... new Set(str)].join("");
  },

  naturalList (list, delim, endWith) {
    if (list.length === 1) return list[0];
    
    let str = list.slice(0, list.length-1).join(delim);
    str += `${delim}${endWith}${list[list.length-1]}`;

    return str;
  },
}