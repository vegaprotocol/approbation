/**
 * Check all markdown files in the protocol folder are name appropriately
 *
 * An filename is based off:
 * 1. The sequence number of the specification file
 * 2. The 4 character string ID of the specification file
 *
 * This script can be replaced by a script in any language, as long as it helps point to
 * files that don't look right as per the above. It's not elegant, but it gets the job done.
 */
const glob = require('fast-glob')
const path = require('path')
const { validSpecificationFilename, ignoreFiles } = require('./lib')
const pc = require('picocolors')

function getRandomCode() {
  return Array.from({length: 4}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]).join('');
}

function padNumber(number) {
  // Convert the number to a string
  let str = number.toString();
  
  // Pad the string with zeros if necessary
  while (str.length < 4) {
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

function nextFilename(paths, ignoreGlob, verbose) {
  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const fileList = ignoreFiles(glob.sync(paths, {}), ignoreList)
  const seenSequenceNumbers = []
  let nextHighest = 0
  let nextLowest = 0

  let exitCode = 0

  if (fileList.length > 0) {
    fileList.forEach(file => {
      const fileName = path.basename(file)
  
      if (fileName.toLowerCase().indexOf('readme') !== -1) {
        return
      }

      const codeStart = fileName.match(validSpecificationFilename)
  
      // If the filename doesn't match, it's an error
      if (codeStart !== null) {
        // If the sequence number is 0000, it's incorrect
        if (codeStart[1] !== '0000') {
          // If the sequence number is a duplicate, it's incorrect
          if (seenSequenceNumbers.indexOf(codeStart[1]) === -1) {
            seenSequenceNumbers.push(codeStart[1])
          }
        }
      }
    })
    fileList.sort()

    nextHighest = seenSequenceNumbers.length > 0 ? parseInt(seenSequenceNumbers[seenSequenceNumbers.length - 1]) + 1 : 1
    nextLowest = findLowestNumber(seenSequenceNumbers)
    if (verbose) {
      console.log(`Files that matched: ${fileList.map(s => pc.green(path.basename(s))).join(', ')}`)
    }

    if (nextHighest) {
      let moreSpecific = ' ';
      if (nextHighest !== nextLowest) {
        moreSpecific = 'highest '
      }
      const n = padNumber(nextHighest) 
      console.log(`Next ${moreSpecific}sequence number: ${pc.green(n)} (e.g. ${pc.green(`${n}-${getRandomCode()}-descriptive_name.md`)})`)
    }

    if (nextLowest && nextLowest !== nextHighest) {
      const n = padNumber(nextLowest) 
      console.log(`Lowest unused sequence number: ${pc.green(n)} (e.g. ${pc.green(`${n}-${getRandomCode()}-descriptive_feature_name.md`)})`)
    }
  } else {
    console.error(pc.red(`glob matched no files (${paths})`))
    exitCode = 1
  }

  return {
    nextHighest: nextHighest && nextHighest !== 0 ? padNumber(nextHighest) : '-',
    nextLowest: nextLowest && nextLowest !== 0 ? padNumber(nextLowest) : '-',
    exitCode
  }
}

module.exports = {
  getRandomCode,
  padNumber,
  findLowestNumber,
  nextFilename
}
