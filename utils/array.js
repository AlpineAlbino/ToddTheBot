const numUtils = require('./number.js');

module.exports = {
	name: 'arrayUtils',
  description: `Array utilities`,

  roundArr (input, decimalAboveOne=0, decimalBelowOne=2) {
    input = input.map(
      function (i) {
        return Number((i >= 1) ? i.toFixed(decimalAboveOne) : i.toFixed(decimalBelowOne));
      }
    );

    return input;
  },
  
  getRandomDistributed ([...values], [...distributions], count=1) {
    const checkNum = numUtils.getInteger(count);
    if (checkNum === false || checkNum < 1) throw new Error(`Receiving count ${count} is not a number.`);
    
    if (values.length <= 1) throw new Error(`Array ${values} must have at least 2 items.`);
    // if arr lengths aren't equal return false
    if (values.length !== distributions.length) throw new Error(`Value array has ${values.length} items, but Distribution array has ${distributions.length} items.`);
    
    // if no distribution given, everything is chosen randomly
    if (distributions.length < 1) return module.exports.getRandomItem(values, count);

    // if there's distribution things get harder
    // redistribute the dist array so everything adds up to 1
    const normDistValue = 1 / numUtils.getSum(distributions);
    const randomDistMapSingle = distributions.map((dist) => dist * normDistValue);
    // then change it so current value is sum of everything before it
    // the first item should be -1 and last item should be 1
    // because Math.random() returns [0, 1) so there's a chance 0 is collected
    let sum = 0;
    const randomDistMap = [0, ...randomDistMapSingle.map((value) => sum += value)];
    
    let returnItems = [];
    for (let i = 0; i < count; i++) {
      const seed = Math.random();
      // take the highest number that is smaller than the seed
      // [0, 25, 75, 100] and seed = 90 => take 75 aka. third value
      const filteredDistMap = randomDistMap.filter((value) => value <= seed);
      returnItems.push(values[filteredDistMap.length - 1]); // array indexes start at 0
    }

    return (returnItems.length === 1) ? returnItems[0] : returnItems;
  },

  arrayify (object) {
    if (Array.isArray(object)) return [...object];
	  return [object];
  },
  
  getArrUnion (arr1, arr2) {
    return [...new Set([...arr1, ...arr2])];
  },

  getArrIntersect (arr1, arr2) {
    return arr1.filter(x => arr2.includes(x));
  },

  getArrDifference (arr1, arr2) {
    return arr1.filter(x => !arr2.includes(x));
  },

  getArrSymmetricalDifference (arr1, arr2) {
    return arr1
      .filter(x => !arr2.includes(x))
      .concat(arrB.filter(x => !arrA.includes(x)));
  },

  getUniqueArray (arr) {
    return [... new Set(arr)];
  },

  shuffle (arr) {
    return arr.sort(() => 0.5 - Math.random());
  },

  getRandomItem (arr, count=1) {
    if (count=1) return arr[Math.floor(Math.random() * arr.length)];

    return module.exports.shuffle(arr).slice(0, count);
  },
}