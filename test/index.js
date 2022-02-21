const test = require('tape')
const { checkFilenames } = require('../src/check-filenames')
const { checkCodes } = require('../src/check-codes')
const { checkReferences } = require('../src/check-references')

test('check-filenames: exit with error if there are 2 filenames with the same sequence number', t => {
  t.plan(1)

  const { exitCode } = checkFilenames('./test/check-filenames/duplicate-sequence/**/*.md')
  t.equal(exitCode, 1, 'Expected an error code due to duplicate numbers')
})

test('check-filenames: exit with success if all file codes are valid', t => {
  t.plan(1)

  const { exitCode } = checkFilenames('./test/check-filenames/all-valid/**/*.md')
  t.equal(exitCode, 0, 'Expected success code, as this is the happy path')
})

test('check-filenames: README is always ignored', t => {
  t.plan(1)

  const { exitCode } = checkFilenames('./test/check-filenames/readme-is-ignored/**/*.md')
  t.equal(exitCode, 0, 'Expected success code, as this is the happy path')
})

test('check-filenames: filenames can have a mix of extensions without a problem...', t => {
  t.plan(1)

  const { exitCode } = checkFilenames('./test/check-filenames/relevant-extensions/**/*.{md,ipynb,txt}')
  t.equal(exitCode, 0, 'Expected success code as the .ipynb and .md files are valid')
})

test('check-filenames: ... but any matched file must be coded', t => {
  t.plan(1)

  const { exitCode } = checkFilenames('./test/check-filenames/relevant-extensions/**/*.{md,ipynb,txt,svg}')
  t.equal(exitCode, 1, 'Expected failure due to uncoded svg')
})

test('check-codes: Happy path', t => {
  t.plan(5)

  const { exitCode, res } = checkCodes('./test/check-codes/all-valid/**/*.md')
  t.equal(exitCode, 0, 'Expected success')
  t.equal(res.countAcceptableFiles, 2, 'There are 2 acceptable files')
  t.equal(res.countEmptyFiles, 1, 'One is empty')
  t.equal(res.countErrorFiles, 0, 'None have errors')
  t.equal(res.countAcceptanceCriteria, 5, 'There are five distinct ACs')
})

test('check-codes: An invalid file', t => {
  t.plan(2)

  const { exitCode, res } = checkCodes('./test/check-codes/a-tag-not-a-link/**/*.md')
  t.equal(exitCode, 1, 'Expected failure')
  t.equal(res.countErrorFiles, 1, 'One file has an error')
})

test('check-codes: Readme is always ignored', t => {
  t.plan(4)

  const { exitCode, res } = checkCodes('./test/check-codes/readme-is-ignored/**/*.md')
  t.equal(exitCode, 0, 'Expected success')
  t.equal(res.countAcceptableFiles, 1, 'One file is acceptable')
  t.equal(res.countEmptyFiles, 0, 'No files are empty')
  t.equal(res.countErrorFiles, 0, 'No files have errors')
})

test('check-references: Happy path, 100% referenced', t => {
  t.plan(4)

  const { exitCode, res } = checkReferences('./test/check-references/complete-coverage/**/*.md', './test/check-references/complete-coverage/**/*.{feature,py}')
  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 1, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaReferencedPercent, 100, 'That is 100%')
})

test('check-references: 50% referenced, both from one spec', t => {
  t.plan(5)

  const { exitCode, res } = checkReferences('./test/check-references/fifty-percent/**/*.md', './test/check-references/fifty-percent/**/*.{feature,py}')
  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 2, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaUnreferencedTotal, 1, 'That one criteria is not referenced')
  t.equal(res.criteriaReferencedPercent, 50, 'That is 50%')
})

test('check-references: multiple specs, multiple tests', t => {
  t.plan(5)

  const { exitCode, res } = checkReferences('./test/check-references/complex/specs/*.{md,ipynb}', './test/check-references/complex/**/*.{feature,py}')
  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 3, 'Three criteria exist')
  t.equal(res.criteriaReferencedTotal, 2, 'Two criteria is referenced')
  t.equal(res.criteriaUnreferencedTotal, 1, 'That one criteria is not referenced')
  t.equal(res.criteriaReferencedPercent, 67, 'That is 67%')
})

test('check-references: README is ignored', t => {
  t.plan(4)

  const { exitCode, res } = checkReferences('./test/check-references/readme-is-ignored/**/*.md', './test/check-references/readme-is-ignored/**/*.{feature,py}')
  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 1, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaReferencedPercent, 100, 'That is 100%')
})
