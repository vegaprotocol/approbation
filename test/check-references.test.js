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

test('check-references: Ignore ignores specs...', t => {
  const path = './test/check-references/ignore-specs/**/'
  t.plan(4)

  quiet()
  const allFiles = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, './test/test-data/categories.json')
  const ignore = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, './test/test-data/categories.json', `${path}0002*.md`)
  loud()

  t.equal(allFiles.res.criteriaTotal, 2, 'All files: two criteria exist')
  t.equal(allFiles.res.criteriaReferencedPercent, '50.0', 'All files: coverage is 50%')

  t.equal(ignore.res.criteriaTotal, 1, 'Ignore: One criteria exists')
  t.equal(ignore.res.criteriaReferencedPercent, '100.0', 'Ignore: coverage is 100%')
})

test('check-references: ...ignore also applies to tests...', t => {
  const path = './test/check-references/ignore-tests/**/'
  t.plan(4)

  quiet()
  const allFiles = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, './test/test-data/categories.json')
  const ignore = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, './test/test-data/categories.json', `${path}another-test.feature`)
  loud()

  t.equal(allFiles.res.criteriaTotal, 2, 'All files: two criteria exist')
  t.equal(allFiles.res.criteriaReferencedPercent, '100.0', 'All files: coverage is 100%')

  t.equal(ignore.res.criteriaTotal, 2, 'Ignore: Two criteria exist')
  t.equal(ignore.res.criteriaReferencedPercent, '50.0', 'Ignore: coverage is 50%')
})

test('check-references: ...which is to say both simultaneously', t => {
  const path = './test/check-references/ignore-both/**/'
  t.plan(4)

  quiet()
  const allFiles = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, './test/test-data/categories.json')
  const ignore = checkReferences(`${path}*.md`, `${path}*.{feature,py}`, './test/test-data/categories.json', `${path}{another-test*,0001*}`)
  loud()

  t.equal(allFiles.res.criteriaTotal, 2, 'All files: two criteria exist')
  t.equal(allFiles.res.criteriaReferencedPercent, '100.0', 'All files: coverage is 100%')

  t.equal(ignore.res.criteriaTotal, 1, 'Ignore: One criteria exists')
  t.equal(ignore.res.criteriaReferencedPercent, '100.0', 'Ignore: coverage is 100%')
})

test('check-references: detect references in tests that are not in specs', t => {
  const path = './test/check-references/mystery-criteria/**/'
  t.plan(4)

  quiet()
  const { res } = checkReferences(`${path}*.md`, `${path}*.feature`, './test/test-data/categories.json')
  loud()

  t.equal(res.criteriaTotal, 2, 'Two valid criteria exist in specs')

  const mc = res.unknownCriteriaInTests
  t.equal(mc.size, 1, 'There should be 1 mystery criteria')

  t.equal(mc.keys().next().value, '0007-MYST-001', 'It should list the unkown code')
  t.equal(mc.values().next().value[0], 'test/check-references/mystery-criteria/tests/test.feature', 'It should point to the file with the unknown code')
})

test('check-references: Specs can be in multiple categories at once', t => {
  const path = './test/check-references/multiple-categories/**/'
  t.plan(20)

  quiet()
  const { res } = checkReferences(`${path}*.md`, `${path}*.feature`, './test/check-references/multiple-categories/categories/categories.json', '', false, false, true)
  loud()

  const c = res.categories

  t.equal(c[0].Category, 'JustTheOneSpec', 'Just The One Spec category exists')
  t.equal(c[0].Specs, 1, 'Just The One Spec category has just the one spec')
  t.equal(c[0].Criteria, 1, 'The spec in this category has one criteria')

  t.equal(c[1].Category, 'AnotherCategoryWithJustOneSpec', 'Another Category With Just One Spec category exists')
  t.equal(c[1].Specs, 1, 'Another Category with Just One Spec category has just the one spec')
  t.equal(c[1].Criteria, 3, 'The spec in this category has three criteria')

  t.equal(c[2].Category, 'CATEisAlsoInHere', 'Cate Is Also In Here category exists')
  t.equal(c[2].Specs, 1, 'CATE Is Also In Here category has one spec, which has been in a previous category')
  t.equal(c[2].Criteria, 3, 'The spec in this category has three criteria (same as the last one)')
  
  t.equal(c[3].Category, 'AllSpecs', 'AllSpecs contains two specifications')
  t.equal(c[3].Specs, 2, 'AllSpecs contains both specifications')
  t.equal(c[3].Criteria, 4, 'The specs in this category have four criteria (total)')

  t.equal(c[4].Category, 'Unknown', 'No specs with no category')
  t.equal(c[4].Specs, '-', 'No specs with no category')
  t.equal(c[4].Criteria, '-', 'No criteria in no specs with no category')

  t.equal(c[5].Category, 'Total', 'Total should be 2, not the sum of all categories')
  t.equal(c[5].Specs, 2, 'There are 2 specs, same as AllSpecs')
  t.equal(c[5].Criteria, 4, 'There are 4 criteria, same as AllSpecs')
  t.equal(c[5].Covered, 4, 'There are 4 covered criteria, same as AllSpecs')
  t.equal(c[5]['by/FeatTest'], 4, 'There are 4 criteria covered by feature tests, same as AllSpecs')
})
