const test = require('tape')
const { checkReferences } = require('../src/check-references')
const { quiet, loud } = require('./lib')

test('check-references: Happy path, 100% referenced', t => {
  t.plan(4)

  quiet()
  const { exitCode, res } = checkReferences('./test/check-references/complete-coverage/**/*.md', './test/check-references/complete-coverage/**/*.{feature,py}')
  loud()

  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 1, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaReferencedPercent, 100, 'That is 100%')
})

test('check-references: 50% referenced, both from one spec', t => {
  t.plan(5)

  quiet()
  const { exitCode, res } = checkReferences('./test/check-references/fifty-percent/**/*.md', './test/check-references/fifty-percent/**/*.{feature,py}')
  loud()

  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 2, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaUnreferencedTotal, 1, 'That one criteria is not referenced')
  t.equal(res.criteriaReferencedPercent, 50, 'That is 50%')
})

test('check-references: multiple specs, multiple tests', t => {
  t.plan(5)

  quiet()
  const { exitCode, res } = checkReferences('./test/check-references/complex/specs/*.{md,ipynb}', './test/check-references/complex/**/*.{feature,py}')
  loud()

  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 3, 'Three criteria exist')
  t.equal(res.criteriaReferencedTotal, 2, 'Two criteria is referenced')
  t.equal(res.criteriaUnreferencedTotal, 1, 'That one criteria is not referenced')
  t.equal(res.criteriaReferencedPercent, 67, 'That is 67%')
})

test('check-references: README is ignored', t => {
  t.plan(4)

  quiet()
  const { exitCode, res } = checkReferences('./test/check-references/readme-is-ignored/**/*.md', './test/check-references/readme-is-ignored/**/*.{feature,py}')
  loud()

  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 1, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaReferencedPercent, 100, 'That is 100%')
})

test('check-references: Ignore ignores specs...', t => {
  const path = './test/check-references/ignore-specs/**/'
  t.plan(4)

  quiet()
  const allFiles = checkReferences(`${path}*.md`, `${path}*.{feature,py}`)
  const ignore = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, `${path}0002*.md`)
  loud()

  t.equal(allFiles.res.criteriaTotal, 2, 'All files: two criteria exist')
  t.equal(allFiles.res.criteriaReferencedPercent, 50, 'All files: coverage is 50%')

  t.equal(ignore.res.criteriaTotal, 1, 'Ignore: One criteria exists')
  t.equal(ignore.res.criteriaReferencedPercent, 100, 'Ignore: coverage is 100%')
})

test('check-references: ...ignore also applies to tests...', t => {
  const path = './test/check-references/ignore-tests/**/'
  t.plan(4)

  quiet()
  const allFiles = checkReferences(`${path}*.md`, `${path}*.{feature,py}`)
  const ignore = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, `${path}another-test.feature`)
  loud()

  t.equal(allFiles.res.criteriaTotal, 2, 'All files: two criteria exist')
  t.equal(allFiles.res.criteriaReferencedPercent, 100, 'All files: coverage is 100%')

  t.equal(ignore.res.criteriaTotal, 2, 'Ignore: Two criteria exist')
  t.equal(ignore.res.criteriaReferencedPercent, 50, 'Ignore: coverage is 50%')
})

test('check-references: ...which is to say both simultaneously', t => {
  const path = './test/check-references/ignore-both/**/'
  t.plan(4)

  quiet()
  const allFiles = checkReferences(`${path}*.md`, `${path}*.{feature,py}`)
  const ignore = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, `${path}{another-test*,0001*}`)
  loud()

  t.equal(allFiles.res.criteriaTotal, 2, 'All files: two criteria exist')
  t.equal(allFiles.res.criteriaReferencedPercent, 100, 'All files: coverage is 100%')

  t.equal(ignore.res.criteriaTotal, 1, 'Ignore: One criteria exists')
  t.equal(ignore.res.criteriaReferencedPercent, 100, 'Ignore: coverage is 100%')
})
