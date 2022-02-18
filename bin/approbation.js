#!/usr/bin/env node

const { checkFilenames } = require('../src/check-filenames')

require('../src/check-filenames')

const argv = require('minimist')(process.argv.slice(2))
const command = argv._[0]

let res

if (command === 'check-filenames') {
  const paths = argv.specs ? argv.specs : '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
  res = checkFilenames(paths)
  process.exit(res.exitCode)
} else if (command === 'check-codes') {
  require('../src/check-codes')
} else if (command === 'check-references') {
  require('../src/check-references')
} else {
  console.error('Please choose a command')
  console.group('Available commands:')

  console.log('check-codes:      Looks for possible errors in the coding of acceptance criteria')
  console.log('check-filenames:  Check that spec filenames are valid')
  console.log('check-references: Coverage statistics for acceptance criteria')
  console.groupEnd('Available commands')
}
