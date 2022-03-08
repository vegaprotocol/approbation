const test = require('tape')
const { checkCodes } = require('../src/check-codes')
const { quiet, loud } = require('./lib')

test('check-codes: Happy path', t => {
  t.plan(5)

  quiet()
  const { exitCode, res } = checkCodes('./test/check-codes/all-valid/**/*.md')
  loud()

  t.equal(exitCode, 0, 'Expected success')
  t.equal(res.countAcceptableFiles, 2, 'There are 2 acceptable files')
  t.equal(res.countEmptyFiles, 1, 'One is empty')
  t.equal(res.countErrorFiles, 0, 'None have errors')
  t.equal(res.countAcceptanceCriteria, 5, 'There are five distinct ACs')
})

test('check-codes: An invalid file', t => {
  t.plan(2)

  quiet()
  const { exitCode, res } = checkCodes('./test/check-codes/a-tag-not-a-link/**/*.md')
  loud()

  t.equal(exitCode, 1, 'Expected failure')
  t.equal(res.countErrorFiles, 1, 'One file has an error')
})

test('check-codes: Detect duplicate codes as an error', t => {
  t.plan(2)

  quiet()
  const { exitCode, res } = checkCodes('./test/check-codes/duplicate-code/**/*.md')
  loud()

  t.equal(exitCode, 1, 'Expected failure')
  t.equal(res.countErrorFiles, 1, 'One file has an error')
})

test('check-codes: Readme is always ignored', t => {
  t.plan(4)

  quiet()
  const { exitCode, res } = checkCodes('./test/check-codes/readme-is-ignored/**/*.md')
  loud()

  t.equal(exitCode, 0, 'Expected success')
  t.equal(res.countAcceptableFiles, 1, 'One file is acceptable')
  t.equal(res.countEmptyFiles, 0, 'No files are empty')
  t.equal(res.countErrorFiles, 0, 'No files have errors')
})
