#!/usr/bin/env node

const packageJson = require('../package.json')
const { checkFilenames } = require('../src/check-filenames')
const { checkCodes } = require('../src/check-codes')
const { checkReferences } = require('../src/check-references')
const pc = require('picocolors')
const { outputBranches } = require('../src/lib/get-project-branches')
const argv = require('minimist')(process.argv.slice(2))
const command = argv._[0]

function warn (lines) {
  console.warn('')
  lines.map(l => console.warn(pc.yellow(`! ${l}`)))
  console.warn('')
}

function showArg (arg, description) {
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

if (command === 'check-filenames') {
  let paths = '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
  const ignoreGlob = argv.ignore

  if (!argv.specs) {
    warn(['No --specs argument provided, defaulting to:', `--specs="${paths}"`, '(This behaviour will be deprecated in 3.0.0)'])
  } else {
    paths = argv.specs
  }

  res = checkFilenames(paths, ignoreGlob)
  process.exit(res.exitCode)
} else if (command === 'check-codes') {
  let paths = '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
  const ignoreGlob = argv.ignore
  const isVerbose = argv.verbose === true

  if (!argv.specs) {
    warn(['No --specs argument provided, defaulting to:', `--specs="${paths}"`, '(This behaviour will be deprecated in 3.0.0)'])
  } else {
    paths = argv.specs
  }

  res = checkCodes(paths, ignoreGlob, isVerbose)
  process.exit(res.exitCode)
} else if (command === 'check-references') {
  let specsGlob = '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
  let testsGlob = '{./qa-scenarios/**/*.{feature,py}}'
  const ignoreGlob = argv.ignore
  const showMystery = argv['show-mystery'] === true
  const showCategoryStats = argv['category-stats'] === true
  const isVerbose = argv.verbose === true
  const showFiles = argv['show-files'] === true

  if (!argv.specs) {
    warn(['No --specs argument provided, defaulting to:', `--specs="${specsGlob}"`, '(This behaviour will be deprecated in 3.0.0)'])
  } else {
    specsGlob = argv.specs
  }

  if (!argv.tests) {
    warn(['No --tests argument provided, defaulting to:', `--specs="${testsGlob}"`, '(This behaviour will be deprecated in 3.0.0)'])
  } else {
    testsGlob = argv.tests
  }

  res = checkReferences(specsGlob, testsGlob, ignoreGlob, showMystery, isVerbose, showCategoryStats, showFiles)

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
  showArg(`--ignore="${pc.yellow('{tests/**/*.{py,feature}')}"`, 'glob of files to ignore for both tests and specs')
  showArg('--show-mystery', 'If set, display criteria in tests that are not in any specs matched by --specs')
  showArg('--category-stats', 'Show more detail for referenced/unreferenced codes')
  showArg('--show-branches', 'Show git branches for subfolders of the current folder')
  showArg('--show-files', 'Show basic stats per file')
  showArg('--verbose', 'Show more detail for each file')
  console.groupEnd('Arguments')
  console.groupEnd('check-references')
}
