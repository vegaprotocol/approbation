#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))

switch (argv._[0]) {
  case 'check-codes':
    require('../src/check-codes')
    break
  case 'check-references':
    require('../src/check-references')
    break
  case 'check-filenames':
    require('../src/check-filenames')
    break
  default:
    console.log('Please choose a valid command')
    process.exit(1)
}
