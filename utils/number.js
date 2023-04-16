module.exports = {
	name: 'numberUtils',
  description: `Number utilities`,

  getRoot(x, n) {
    if (x < 0 && n % 2 === 0) throw new Error(`Negative number ${x} can't have an even root.`);
    return (x < 0 ? -1 : 1) * Math.pow(Math.abs(x), 1/n);
  },

  getAverage (arr) {
    if (arr.length < 1) return 0; // return false if there are no elements in array
    return this.getSum(arr) / arr.length; // module hopefully should work
  },

  getSum (arr) {
    return arr.reduce((partialSum, a) => (partialSum + a), 0);
  },
  
  getMax (arr) {
    return Math.max(...arr);
  },

  getMin (arr) {
    return Math.min(...arr);
  },

  getRandomNumber (min, max, intMode=false, count=1) {
    const returnArr = Array.from({ length: count }, () => (intMode) ? Math.floor(Math.random() * (max - min + 1) + min) : Math.random() * (max - min + 1) + min);

    return (count === 1) ? returnArr[0] : returnArr;
  },

  roundTo (num, decimalAboveOne, decimalBelowOne) {
    return Number((num >= 1) ? num.toFixed(decimalAboveOne) : num.toFixed(decimalBelowOne));
  },

  getInteger (input) {
    const convertedInt = Number(input);
    const returnedVal = (Number.isInteger(convertedInt)) ? convertedInt : false;

    return returnedVal;
  },

  getNumber (input) {
    const convertedNum = Number(input);
    const returnedVal = (!Number.isNaN(convertedNum)) ? convertedNum : false;

    return returnedVal;
  },
}