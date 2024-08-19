/**
 */
const pc = require('picocolors')
const { ignoreFiles, acceptanceCodeElements, validSpecificationPrefix } = require('./lib')
const { checkPath } = require('./check-codes')
const path = require('path')
const glob = require('fast-glob')

function padNumber(number, length = 4) {
  // Convert the number to a string
  let str = number.toString();
  
  // Pad the string with zeros if necessary
  while (str.length < length) {
    str = "0" + str;
  }
  
  return str;
}

function findLowestNumber(numbers) {
  // Convert the numbers to integers and sort them in ascending order
  numbers = numbers.map(Number).sort((a, b) => a - b);
  
  // Find the lowest number that is not present in the array
  let lowestNumber = 1;
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] === lowestNumber) {
      lowestNumber++;
    } else if (numbers[i] > lowestNumber) {
      break;
    }
  }
  
  return lowestNumber;
}

/**
 * Given a list of all of the codes in a file, it gives you the file's sequence (e.g. 001) 
 * @param {array} codes An array of string AC codes
 * @returns {arr} An array of all of the codes in the array
 */
function extractSequenceFromCodes(codes) {
  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return []
  }
  return codes.map(code => {
    try {
      const res = code.match(acceptanceCodeElements)
      if (!res || !res[3] || !res[3].length === 3 || res[3] === "000") {
        return undefined
      }
      return res[3]
    } catch (e) {
      return undefined
    }
  })
}

/**
 * Given a list of all of the codes in a file, it gives you the file's prefix (e.g. 0001-PREF)
 * Currently they should all match, so this would return a single item. In future this may change
 * so it might return multiple items.
 * 
 * @param {arr} codes An array of string AC codes
 * @returns {arr} An array of unique string prefixes that appear in the codes array
 */
function extractPrefixFromCodes(codes) {
  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return []
  }

  return Array.from(new Set(codes.map(code => {
    try {
      const res = code.match(validSpecificationPrefix)
      if (!res || !res[1]) {
        return undefined
      }
      return res[1]
    } catch (e) {
      return undefined
    }
  }).filter(c => c && c.length > 0)))
}

/**
 * Returns a random array element. It didn't seem worth importing lodash.sample
 * just for this.
 * 
 * @param {Array} arr an array of anything. In our case, strings
 * @return {any} a random element from the array, in this case, a string
 */
function sample(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    throw new Error('Cannot sample from an empty array')
  }
  
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Given a filename, suggests possible AC codes that are unused
 * 
 * @param {string} paths Glob of paths. Currently should only match one file.
 * @param {string} ignoreGlob Glob of files to ignore. Optional.
 * @param {boolean} verbose Whether to print out extra information
 * @returns 
 */
function nextCode(paths, ignoreGlob, verbose) {
  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const fileList = ignoreFiles(glob.sync(paths, {}), ignoreList)

  let nextHighest = 0
  let nextLowest = 0
  let exitCode = 0

  if (fileList.length > 0) {
    const files = checkPath(fileList, false)

    if (files.countFiles === 0) {
      exitCode = 1
      console.error(pc.red(`glob matched no files (${paths})`))
    } else if (files.countFiles > 1) {
      exitCode = 1
      console.error(pc.red(`glob matched more than one file (${paths})`))
    } else {
      const file = path.basename(fileList[0])

      console.log('In file: ' + file)
      const usedCodes = extractSequenceFromCodes(files.uniqueCodes)
      
      // Currently prefixes should match the filename, i.e. this should return an array length of 1
      // however this may change in future so instead we get them all and take a random one. For now
      // this is equivalent to just pulling the prefix from the first item, but in future it might not be.
      const prefixes = extractPrefixFromCodes(files.uniqueCodes)
      const prefix = sample(prefixes)

      if (verbose) {
        console.log(`Found codes: ${usedCodes.map(s => pc.green(s)).join(', ')}`)
      }
      nextHighest = usedCodes.length > 0 ? parseInt(usedCodes[usedCodes.length - 1]) + 1 : 1
      nextLowest = findLowestNumber(usedCodes, false)
    
      if (nextHighest) {
        let moreSpecific = '';
        if (nextHighest !== nextLowest) {
          moreSpecific = 'highest '
        }
        const n = padNumber(nextHighest, 3) 
        console.log(`Next ${moreSpecific}sequence number: ${pc.green(n)} (e.g. ${pc.green(`${prefix}-${n}`)})`)
      }
  
      if (nextLowest && nextLowest !== nextHighest) {
        const n = padNumber(nextLowest, 3) 
        console.log(`Lowest unused sequence number: ${pc.green(n)} (e.g. ${pc.green(`${prefix}-${n}`)}) - ${pc.red('Remember to check this is not referenced in a test!')}`)
      }
    }
  }

  return {
    nextHighest: nextHighest && nextHighest !== 0 ? padNumber(nextHighest, 3) : '-',
    nextLowest: nextLowest && nextLowest !== 0 ? padNumber(nextLowest, 3) : '-',
    exitCode
  }
}

module.exports = {
  nextCode,
  extractPrefixFromCodes,
  extractSequenceFromCodes,
  sample
}
