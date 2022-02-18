#!/usr/bin/env node

const { checkFilenames } = require('../src/check-filenames')
const { checkCodes } = require('../src/check-codes')
const { checkReferences } = require('../src/check-references')

require('../src/check-filenames')

const argv = require('minimist')(process.argv.slice(2))
const command = argv._[0]

let res

if (command === 'check-filenames') {
  const paths = argv.specs ? argv.specs : '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
  res = checkFilenames(paths)
  process.exit(res.exitCode)
} else if (command === 'check-codes') {
  const paths = argv.specs ? argv.specs : '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
  res = checkCodes(paths)
  process.exit(res.exitCode)
} else if (command === 'check-references') {
  const specsGlob = argv.specs ? argv.specs : '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
  const testsGlob = argv.tests ? argv.specs : '{./qa-scenarios/**/*.{feature,py}}'
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
