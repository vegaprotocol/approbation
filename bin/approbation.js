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

let res

console.log(pc.bold(`Approbation ${packageJson.version}`))

console.log('')

if (argv && argv['show-branches']) {
  outputBranches()
  console.log()
}

if (command === 'check-filenames') {
  let paths = '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'

  if (!argv.specs) {
    warn(['No --specs argument provided, defaulting to:', `--specs="${paths}"`, '(This behaviour will be deprecated in 3.0.0)'])
  } else {
    paths = argv.specs
  }

  res = checkFilenames(paths)
  process.exit(res.exitCode)
} else if (command === 'check-codes') {
  let paths = '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'

  if (!argv.specs) {
    warn(['No --specs argument provided, defaulting to:', `--specs="${paths}"`, '(This behaviour will be deprecated in 3.0.0)'])
  } else {
    paths = argv.specs
  }

  res = checkCodes(paths)
  process.exit(res.exitCode)
} else if (command === 'check-references') {
  let specsGlob = '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
  let testsGlob = '{./qa-scenarios/**/*.{feature,py}}'

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

  res = checkReferences(specsGlob, testsGlob)

  process.exit(res.exitCode)
} else {
  console.error('Please choose a command')
  console.group('Available commands:')

  console.group('check-codes')
  console.log('Looks for possible errors in the coding of acceptance criteria')
  console.group('Arguments')
  console.log('--specs="{**/*.md}"')
  console.groupEnd('Arguments')
  console.groupEnd('check-codes')

  console.group('check-filenames')
  console.log('Check that spec filenames are valid')
  console.group('Arguments')
  console.log('--specs="{**/*.md}"')
  console.groupEnd('Arguments')
  console.groupEnd('check-filenames')

  console.group('check-references')
  console.log('Coverage statistics for acceptance criteria')
  console.group('Arguments')
  console.log('--specs="{specs/**/*.md}"')
  console.log('--tests="tests/**/*.{py,feature}"')
  console.groupEnd('Arguments')
  console.groupEnd('check-references')
}
