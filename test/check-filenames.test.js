const test = require('tape')
const { checkFilenames } = require('../src/check-filenames')
const { quiet, loud } = require('./lib')

test('check-filenames: exit with error if there are 2 filenames with the same sequence number', t => {
  t.plan(1)

  quiet()
  const { exitCode } = checkFilenames('./test/check-filenames/duplicate-sequence/**/*.md')
  loud()

  t.equal(exitCode, 1, 'Expected an error code due to duplicate numbers')
})

test('check-filenames: exit with success if all file codes are valid', t => {
  t.plan(1)

  quiet()
  const { exitCode } = checkFilenames('./test/check-filenames/all-valid/**/*.md')
  loud()

  t.equal(exitCode, 0, 'Expected success code, as this is the happy path')
})

test('check-filenames: README is always ignored', t => {
  t.plan(1)

  quiet()
  const { exitCode } = checkFilenames('./test/check-filenames/readme-is-ignored/**/*.md')
  loud()

  t.equal(exitCode, 0, 'Expected success code, as this is the happy path')
})

test('check-filenames: filenames can have a mix of extensions without a problem...', t => {
  t.plan(1)

  quiet()
  const { exitCode } = checkFilenames('./test/check-filenames/relevant-extensions/**/*.{md,ipynb,txt}')
  loud()

  t.equal(exitCode, 0, 'Expected success code as the .ipynb and .md files are valid')
})

test('check-filenames: ... but any matched file must be coded', t => {
  t.plan(1)

  quiet()
  const { exitCode } = checkFilenames('./test/check-filenames/relevant-extensions/**/*.{md,ipynb,txt,svg}')
  loud()

  t.equal(exitCode, 1, 'Expected failure due to uncoded svg')
})

test('check-filenames: Ignore glob ignores ignored files', t => {
  const path = './text/check-filenames/duplicate-sequence/**/'
  t.plan(1)

  quiet()
  const { exitCode } = checkFilenames(`${path}*.{md,ipynb,txt,svg}`, `${path}0001-INTE*.md`)

  loud()

  t.equal(exitCode, 1, 'Expected failure due to uncoded svg')
})
