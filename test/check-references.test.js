const test = require('tape')
const { checkReferences } = require('../src/check-references')
const { quiet, loud } = require('./lib')

test('check-references: Happy path, 100% referenced', t => {
  t.plan(4)

  quiet()
  const { exitCode, res } = checkReferences('./test/check-references/complete-coverage/**/*.md', './test/check-references/complete-coverage/**/*.{feature,py}', './test/test-data/categories.json')
  loud()

  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 1, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaReferencedPercent, '100.0', 'That is 100%')
})

test('check-references: 50% referenced, both from one spec', t => {
  t.plan(5)

  quiet()
  const { exitCode, res } = checkReferences('./test/check-references/fifty-percent/**/*.md', './test/check-references/fifty-percent/**/*.{feature,py}', './test/test-data/categories.json')
  loud()

  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 2, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaUnreferencedTotal, 1, 'That one criteria is not referenced')
  t.equal(res.criteriaReferencedPercent, '50.0', 'That is 50%')
})

test('check-references: multiple specs, multiple tests', t => {
  t.plan(5)

  quiet()
  const { exitCode, res } = checkReferences('./test/check-references/complex/specs/*.{md,ipynb}', './test/check-references/complex/**/*.{feature,py}', './test/test-data/categories.json')
  loud()

  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 3, 'Three criteria exist')
  t.equal(res.criteriaReferencedTotal, 2, 'Two criteria is referenced')
  t.equal(res.criteriaUnreferencedTotal, 1, 'That one criteria is not referenced')
  t.equal(res.criteriaReferencedPercent, '66.7', 'That is 66.7%')
})

test('check-references: README is ignored', t => {
  t.plan(4)

  quiet()
  const { exitCode, res } = checkReferences('./test/check-references/readme-is-ignored/**/*.md', './test/check-references/readme-is-ignored/**/*.{feature,py}', './test/test-data/categories.json')
  loud()

  t.equal(exitCode, 0, 'Success')
  t.equal(res.criteriaTotal, 1, 'One criteria exists')
  t.equal(res.criteriaReferencedTotal, 1, 'That one criteria is referenced')
  t.equal(res.criteriaReferencedPercent, '100.0', 'That is 100%')
})