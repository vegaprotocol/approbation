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

test('check-codes: ignore glob ignores ignored files', t => {
  const path = './test/check-codes/ignore/**/'
  t.plan(4)

  quiet()
  const allFiles = checkCodes(`${path}*.md`)
  const ignore = checkCodes(`${path}*.md`, `${path}0028*.md`)
  loud()

  t.equal(ignore.exitCode, 0, 'Ignore: Expected success')
  t.equal(ignore.res.countErrorFiles, 0, 'Ignore: The file with an error is ignored')

  t.equal(allFiles.exitCode, 1, 'All files: Expected failure')
  t.equal(allFiles.res.countErrorFiles, 1, 'All files: The file with an error is ignored')
})

test('check-codes: Do not crash when a filename included in the glob is not in the right format', t => {
  t.plan(5)

  quiet();
  const { exitCode, res } = checkCodes('./test/check-codes/invalid-filename-matches-glob/**/*.md')
  loud();

  t.equal(exitCode, 0, 'Expected success')
  t.equal(res.countAcceptableFiles, 1, 'There is 1 acceptable files')
  t.equal(res.countEmptyFiles, 0, 'None are is empty')
  t.equal(res.countErrorFiles, 0, 'None have an error')
  t.equal(res.countAcceptanceCriteria, 1, 'There are three distinct ACs')
})
