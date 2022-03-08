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
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const { validSpecificationFilename, ignoreFiles } = require('./lib')
const pc = require('picocolors')

// Configure the acc
const maxInvalidFilenames = 0

function checkFolder (files) {
  // Keeps track of seen sequence numbers so we can detect duplicates
  const seenSequenceNumbers = []
  // Tally of filenames that pass all the checks
  let countValidFilenames = 0
  // Tally of filenames that fail any checks
  let countInvalidFilenames = 0

  files.forEach(file => {
    const fileName = path.basename(file)

    if (fileName.toLowerCase().indexOf('readme') !== -1) {
      return
    }
    const codeStart = fileName.match(validSpecificationFilename)

    // If the filename doesn't match, it's an error
    if (codeStart === null) {
      console.error(`Invalid filename: ${fileName}`)
      countInvalidFilenames++
    } else {
      // If the sequence number is 0000, it's incorrect
      if (codeStart[1] === '0000') {
        console.error(`Invalid sequence number 0000: ${fileName}`)
        countInvalidFilenames++
      } else {
        // If the sequence number is a duplicate, it's incorrect
        if (seenSequenceNumbers.indexOf(codeStart[1]) !== -1) {
          console.error(`Duplicate sequence number ${codeStart[1]}: ${fileName}`)
          countInvalidFilenames++
        } else {
          seenSequenceNumbers.push(codeStart[1])
        }
      }

      // There should be a human readable bit after the sequence/code
      if (!codeStart[3].length > 0) {
        console.error(`Duplicate sequence number ${codeStart[1]}: ${fileName}`)
        countInvalidFilenames++
      } else {
        countValidFilenames++
      }

      // Unnecessary check, but as we're here anyway - is the file empty?
      const content = fs.readFileSync(`${file}`, 'ascii')
      if (content.length === 0) {
        console.error(`Empty file: ${fileName}`)
      }
    }
  })

  // An acceptable error, output anyway: is there a missing sequence number?
  const missingSequenceNumbers = seenSequenceNumbers.filter((n, i) =>
    (i < seenSequenceNumbers.length - 1 && parseInt(seenSequenceNumbers[i + 1]) !== parseInt(n) + 1)
  ).map(n => parseInt(n) + 1)

  if (missingSequenceNumbers.length > 0) {
    console.info(`Missing sequence number: ${missingSequenceNumbers}`)
  }

  return {
    countInvalidFilenames,
    countValidFilenames
  }
}

function checkFilenames (paths, ignoreGlob) {
  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const fileList = ignoreFiles(glob.sync(paths, {}), ignoreList)

  let exitCode = 0

  if (fileList.length > 0) {
    const p = checkFolder(fileList)

    const total = {
      countInvalidFilenames: p.countInvalidFilenames,
      countValidFilenames: p.countValidFilenames
    }

    console.log()
    console.log(pc.bold(pc.green('Correctly named')) + '    ' + pc.bold(total.countValidFilenames))
    console.log(pc.bold(pc.red('Errors')) + '             ' + pc.bold(total.countInvalidFilenames))
    console.log()

    if (total.countInvalidFilenames > maxInvalidFilenames) {
      exitCode = 1
    } else {
      exitCode = 0
    }
  } else {
    console.error(pc.red(`glob matched no files (${paths})`))
    exitCode = 1
  }

  return {
    exitCode
  }
}

module.exports = {
  checkFolder,
  checkFilenames
}
