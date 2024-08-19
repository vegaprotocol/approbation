#!/usr/bin/env node

const packageJson = require('../package.json')
const { checkFilenames } = require('../src/check-filenames')
const { nextCode } = require('../src/next-code')
const { checkCodes } = require('../src/check-codes')
const { checkFeatures } = require('../src/check-features')
const { checkReferences } = require('../src/check-references')
const pc = require('picocolors')
const { outputBranches } = require('../src/lib/get-project-branches')
const argv = require('minimist')(process.argv.slice(2))
const command = argv._[0]
const IS_DEBUG = process.env.debug !== undefined

function warn(lines) {
  console.warn('')
  lines.map(l => console.warn(pc.yellow(`! ${l}`)))
  console.warn('')
}

function showArg(arg, description) {
  if (description) {
    console.log(`${pc.bold(arg)}: ${description}`)
  } else {
    console.log(`${pc.bold(arg)}`)
  }
}

let res

console.log(pc.bold(`Approbation ${packageJson.version}`))

console.log('')

if (argv && argv['show-branches']) {
  outputBranches()
  console.log()
}

const paths = argv.specs
const ignoreGlob = argv.ignore
const isVerbose = argv.verbose === true
if (!argv.specs) {
  process.exit('All commands require a --specs argument')
}

if (command === 'check-filenames') {
  res = checkFilenames(paths, ignoreGlob)
  process.exit(res.exitCode)
} else if (command === 'next-code') {
  res = nextCode(paths, ignoreGlob, isVerbose)
  process.exit(res.exitCode)
} else if (command === 'check-codes') {

  res = checkCodes(paths, ignoreGlob, isVerbose)
  process.exit(res.exitCode)
} else if (command === 'check-features') {
  if (!argv.features) {
    warn(['No --features argument provided)'])
    process.exit(1);
  }

  res = checkFeatures(specs, argv.features, ignoreGlob, isVerbose)
  process.exit(res.exitCode)
} else if (command === 'check-references') {
  const testsGlob = argv.tests
  const categories = argv.categories
  const features = argv.features
  const ignoreGlob = argv.ignore
  const currentMilestone = argv['current-milestone']
  let outputPath = argv.output

  if (!argv.tests) {
    warn(['No --tests argument provided, exiting'])
    process.exit(1)
  }

  if (!categories) {
    warn(['No --categories argument provided, exiting'])
    process.exit(1)
  }

  // TODO: Turn in to an object
  res = checkReferences(paths, testsGlob, ignoreGlob, features, currentMilestone, outputPath)

  process.exit(res.exitCode)
} else {
  console.error(pc.red(pc.bold('Please choose a command')))
  console.log()
  console.group(pc.bold('Available commands:'))

  console.group(pc.bold('check-codes'))
  console.log('Looks for possible errors in the coding of acceptance criteria')
  console.log()
  console.group('Arguments')
  showArg(`--specs="${pc.yellow('{specs/**/*.md}')}"`, 'glob of specs to pull AC codes from ')
  showArg(`--ignore="${pc.yellow('tests/**/*.{py,feature}')}"`, 'glob of files not to check for codes')
  showArg('--verbose', 'Show more detail for referenced/unreferenced codes')
  showArg('--show-branches', 'Show git branches for subfolders of the current folder')
  console.groupEnd('Arguments')
  console.groupEnd('check-codes')

  console.log()
  console.group(pc.bold('check-filenames'))
  console.log('Check that spec filenames are valid')
  console.log()
  console.group('Arguments')
  showArg(`--specs="${pc.yellow('{specs/**/*.md}')}"`, 'glob of specs to pull AC codes from ')
  showArg(`--ignore="${pc.yellow('tests/**/*.{py,feature')}"`, 'glob of filenames to ignore')
  showArg('--show-branches', 'Show git branches for subfolders of the current folder')
  console.groupEnd('Arguments')
  console.groupEnd('check-filenames')

  console.log()
  console.group(pc.bold('check-references'))
  console.log('Coverage statistics for acceptance criteria')
  console.log()
  console.group('Arguments')
  showArg(`--specs="${pc.yellow('{specs/**/*.md}')}"`, 'glob of specs to pull AC codes from ')
  showArg(`--tests="${pc.yellow('tests/**/*.{py,feature}')}"`, 'glob of tests to match to the spec AC codes')
  showArg(`--categories="${pc.yellow('./specs/protocol/categories.json')}"`, 'Single JSON file that contains the categories for this test run')
  showArg(`--features="${pc.yellow('./specs/protocol/features.json')}"`, 'Single JSON file that contains the features for this test run')
  showArg(`--ignore="${pc.yellow('{tests/**/*.{py,feature}')}"`, 'glob of files to ignore for both tests and specs')
  console.groupEnd('Arguments')
  console.groupEnd('check-references')
}
