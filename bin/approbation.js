#!/usr/bin/env node

const packageJson = require('../package.json')
const { checkFilenames } = require('../src/check-filenames')
const { checkCodes } = require('../src/check-codes')
const { checkReferences } = require('../src/check-references')
const pc = require('picocolors')

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

if (command === 'check-filenames') {
  let retired = []
  let paths = '{./non-protocol-specs/**/*.md,./protocol/**/*.md}'

  if (!argv.specs) {
    warn(['No --specs argument provided, defaulting to:', `--specs="${paths}"`, '(This behaviour will be deprecated in 3.0.0)'])
  } else {
    paths = argv.specs
  }

  if (argv.retired) {
    if (Array.isArray(argv.retired) && argv.retired.length > 0) {
      retired = argv.retired
    } else {
      warn(['--retired provided, but did not look like an array of retired spec codes. Ignored.'])
    }
  }

  res = checkFilenames(paths, { retired })
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

  console.group(pc.bold('check-codes'))
  console.log('Looks for possible errors in the coding of acceptance criteria')
  console.group('Required arguments')
  console.log('--specs="{**/*.md}"')
  console.groupEnd()
  console.groupEnd()

  console.group(pc.bold('check-filenames'))
  console.log('Check that spec filenames are valid. Optional "retired" parameter can silence errors for deleted specs.')
  console.group('Required arguments:')
  console.log('--specs="{**/*.md}"')
  console.groupEnd()
  console.group(pc.dim('Optional arguments:'))
  console.log(pc.dim('--retired=13'))
  console.groupEnd()
  console.groupEnd()

  console.group(pc.bold('check-references'))
  console.log('Coverage statistics for acceptance criteria')
  console.group('Required arguments:')
  console.log('--specs="{specs/**/*.md}"')
  console.log('--tests="tests/**/*.{py,feature}"')
  console.groupEnd()
  console.groupEnd()
}
