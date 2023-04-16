const numUtils = require('./number.js');

// worded, bp
const VocabGrade = require('vocabulary-level-grader');
// word sim
const stringSimilarity = require("string-similarity");

module.exports = {
	name: 'wordUtils',
  description: `Word utilities`,

  getStringSimilarity (strA, strB) {
    return similarity = stringSimilarity.compareTwoStrings(`${strA}`, `${strB}`);
  },

  getWordDifficulty (baseWord) {
    const gradesArr = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const metaObj = VocabGrade(baseWord);
    let gradeString = metaObj.meta.grade;

    // if our word isn't in the database it'll return 0
    // so we have to return false
    if (metaObj.meta.mean < 1) return numUtils.getRandomInt(2, 4, true);
    return gradesArr.indexOf(gradeString) + 1; // 1 to 6
  },

  getVowels (str) {
    const m = str.match(/[aeiou]/gi);
    return (m === null) ? "" : m;
  },

  getConsonants (str) {
    const m = str.match(/[^aeiou]/gi);
    return (m === null) ? "" : m;
  },
}