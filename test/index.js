const test = require('tape')
const { checkFilenames } = require('../src/check-filenames')

test('check-filenames: exit with error if there are 2 filenames with the same sequence number', t => {
  t.plan(1)

  const { exitCode } = checkFilenames('./test/check-filenames/duplicate-sequence/**/*.md')

  t.equal(exitCode, 1, 'Expected an error code')
})

test('check-filenames: exit with success if all file codes are valid', t => {
  t.plan(1)

  const { exitCode } = checkFilenames('./test/check-filenames/all-valid/**/*.md')

  t.equal(exitCode, 0, 'Expected success code')
})

test('check-filenames: exit with success if all file codes are valid', t => {
  t.plan(1)

  const { exitCode } = checkFilenames('./test/check-filenames/relevant-extensions/**/*.{md,ipynb,txt}')

  t.equal(exitCode, 0, 'Expected success code')
})
