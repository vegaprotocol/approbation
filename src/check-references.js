/**
 * Checks for cross references between specs and feature files. Specifically, it lists out:
 * - Which acceptance criteria are referred to in a feature file
 * - Which acceptance criteria are not referred to in any feature file
 *
 * This script is pretty ugly. Sorry.
 */
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const pc = require('picocolors')
const { validSpecificationPrefix, validAcceptanceCriteriaCode, ignoreFiles } = require('./lib')
const { getCategoryForSpec, increaseCodesForCategory, increaseCoveredForCategory, increaseAcceptableSpecsForCategory, increaseUncoveredForCategory, increaseFeatureCoveredForCategory, increaseSystemTestCoveredForCategory, increaseSpecCountForCategory, specCategories } = require('./lib/category')
const { Table } = require('console-table-printer')

// Ugly globals
let verbose = false
let showFiles = false

function gatherSpecs (fileList) {
  // Step 1: Gather all the initial details
  const specFiles = new Map()

  fileList.forEach(file => {
    const fileName = path.basename(file)

    if (fileName.toLowerCase().indexOf('readme') !== -1) {
      return
    }

    const content = fs.readFileSync(`${file}`, 'ascii')
    const codeStart = fileName.match(validSpecificationPrefix)

    // Gather the AC codes in this file
    const regex = new RegExp(`${codeStart[0]}-([0-9]{3})`, 'g')
    const labelledAcceptanceCriteria = content.match(regex)
    let criteria = []

    if (labelledAcceptanceCriteria !== null) {
      // Dedupe labelled acceptance criteria
      criteria = [...new Set(labelledAcceptanceCriteria)]
    }

    const category = getCategoryForSpec(codeStart[0])

    specFiles.set(fileName, {
      name: `${path}${file}`,
      code: codeStart[0],
      file,
      path,
      criteria,
      category
    })
  })

  return specFiles
}

// Step 2: Gather all the features
function gatherTests (fileList) {
  const linksInFeatures = new Map()

  fileList.forEach(file => {
    const fileName = path.basename(file)

    if (fileName.toLowerCase().indexOf('readme') !== -1) {
      return
    }

    const content = fs.readFileSync(`${file}`, 'ascii')

    const codesInFeature = content.match(validAcceptanceCriteriaCode)

    if (codesInFeature !== null) {
      codesInFeature.forEach(acCode => {
        if (linksInFeatures.has(acCode)) {
          const referrers = linksInFeatures.get(acCode)
          referrers.push(file)

          linksInFeatures.set(acCode, [...new Set(referrers)])
        } else {
          linksInFeatures.set(acCode, [file])
        }
      })
    }
  })

  return linksInFeatures
}

function processReferences (specs, tests) {
  let criteriaTotal = 0
  let criteriaReferencedTotal = 0
  let criteriaUnreferencedTotal = 0
  // Step 3: Output the data
  specs.forEach((value, key) => {
    const unreferencedCriteria = []
    const category = value.category && value.category !== 'Unknown' ? ` #${pc.yellow(value.category)}` : ''
    increaseSpecCountForCategory(value.category)

    const acceptableMinimum = 1

    criteriaTotal += value.criteria.length
    increaseCodesForCategory(value.category, value.criteria.length)
    let refOutput = ''
    const criteriaWithRefs = []

    // Tally Criteria
    if (value.criteria && value.criteria.length > 0) {
      value.criteria.forEach(c => {
        const linksForAC = tests.get(c)

        if (linksForAC) {
          refOutput += `${pc.green(c)}:  ${linksForAC.length} (${linksForAC.toString()})\r\n`
          criteriaWithRefs.push(c)
          criteriaReferencedTotal++
          increaseCoveredForCategory(value.category, 1)

          // Hacky hack: Limit these to 1 or 0 rather than a true tally.
          let criteriaAlreadyLoggedSystest = false
          let criteriaAlreadyLoggedFeature = false
          linksForAC.forEach(l => {
            if (!criteriaAlreadyLoggedSystest && l.match('system-tests')) {
              increaseSystemTestCoveredForCategory(value.category, 1)
              criteriaAlreadyLoggedSystest = true
            } else if (!criteriaAlreadyLoggedFeature && l.match('.feature')) {
              increaseFeatureCoveredForCategory(value.category, 1)
              criteriaAlreadyLoggedFeature = true
            }
          })
        } else {
          increaseCoveredForCategory(value.category, 0)
        }

        // Delete used references, so that tests at the end contains only AC codes not found in specs
        tests.delete(c)
      })

      if (criteriaWithRefs.length !== value.criteria.length) {
        value.criteria.forEach(v => {
          if (!criteriaWithRefs.includes(v)) {
            unreferencedCriteria.push(v)
            criteriaUnreferencedTotal++
          }
        })

        increaseUncoveredForCategory(value.category, unreferencedCriteria.length)
      }

      if (value.criteria.length > acceptableMinimum) {
        increaseAcceptableSpecsForCategory(value.category)
      }
    }

    if (showFiles) {
      // Console output
      const count = value.criteria.length > acceptableMinimum ? pc.green(value.criteria.length) : pc.red(value.criteria.length)
      const referenced = criteriaWithRefs.length > acceptableMinimum ? pc.green(criteriaWithRefs.length) : pc.red(criteriaWithRefs.length)

      const tally = ` has ${count} ACs of which ${referenced} are tested`

      console.log(`${pc.bold(key)}${tally}${category}`)
      if (verbose) {
        console.group()
        console.log(`File:          ${value.file}`)
        console.log(`Unreferenced ACs: ${unreferencedCriteria.join(', ')}`)
        if (refOutput.length > 0) {
          console.group(pc.green(pc.bold('Test references')))
          console.log(refOutput)
          console.groupEnd()
        }
        console.groupEnd()
      }
    }
  })

  return {
    criteriaTotal,
    criteriaReferencedTotal,
    criteriaUnreferencedTotal,
    unknownCriteriaInTests: tests
  }
}

function checkReferences (specsGlob, testsGlob, ignoreGlob, showMystery = false, isVerbose = false, showCategoryStats = false, shouldShowFiles = false, shouldOutputCSV = false, shouldOutputJenkins = false) {
  verbose = isVerbose
  showFiles = shouldShowFiles

  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const specList = ignoreFiles(glob.sync(specsGlob, {}), ignoreList)
  const testList = ignoreFiles(glob.sync(testsGlob, {}), ignoreList, 'test')

  let specs, tests
  const exitCode = 0

  if (specList.length > 0 && testList.length > 0) {
    try {
      specs = gatherSpecs(specList)
      tests = gatherTests(testList)
    } catch (e) {
      console.group(pc.red('Error listing files'))
      console.error(pc.red(e))
      console.groupEnd()

      return {
        exitCode: 1,
        res: {}
      }
    }

    const { criteriaTotal, criteriaReferencedTotal, criteriaUnreferencedTotal, unknownCriteriaInTests } = processReferences(specs, tests)
    const criteriaReferencedPercent = Math.round(criteriaReferencedTotal / criteriaTotal * 100)
    const criteriaUnreferencedPercent = Math.round(criteriaUnreferencedTotal / criteriaTotal * 100)

    if (showMystery && unknownCriteriaInTests.size > 0) {
      const g = pc.bold(`${pc.red('Mystery criteria')} referenced in tests, not found in specs:`)
      console.group(g)
      console.dir(unknownCriteriaInTests)
      console.groupEnd(g)
      console.log()
    }

    if (!showCategoryStats) {
      console.log(pc.bold('Total criteria') + `:       ${criteriaTotal}`)
      console.log(pc.green(pc.bold('With references')) + `:      ${criteriaReferencedTotal} (${criteriaReferencedPercent}%)`)
      console.log(pc.red(pc.bold('Without references')) + `:   ${criteriaUnreferencedTotal} (${criteriaUnreferencedPercent}%)`)
    }
    if (showMystery) {
      console.log(pc.red(pc.bold('Mystery criteria')) + `:     ${unknownCriteriaInTests.size}`)
    }

    if (showCategoryStats) {
      const shouldOutputImage = false
      let specFilesTotal = 0
      let labelledFeatureTotal = 0
      let labelledSystestTotal = 0
      let acceptableSpecsTotal = 0

      const categories = Object.keys(specCategories).map(key => {
        const c = specCategories[key]
        const coverage = (c.covered / c.codes * 100).toFixed(1)
        specFilesTotal += c.specCount | 0
        labelledFeatureTotal += c.featureCovered | 0
        labelledSystestTotal += c.systemTestCovered | 0
        acceptableSpecsTotal += c.acceptableSpecCount | 0

        return {
          Category: key,
          Specs: c.specCount || '-',
          Acceptable: c.acceptableSpecCount ? c.acceptableSpecCount : '-',
          Criteria: c.codes || '-',
          Covered: c.covered || '-',
          'by/FeatTest': c.featureCovered || '-',
          'by/SysTest': c.systemTestCovered || '-',
          Uncovered: c.uncovered || '-',
          Coverage: isNaN(coverage) ? '-' : `${coverage}%`
        }
      })

      categories.push({
        Category: 'Total',
        Specs: specFilesTotal,
        Acceptable: acceptableSpecsTotal,
        Criteria: criteriaTotal,
        Covered: criteriaReferencedTotal,
        'by/FeatTest': labelledFeatureTotal,
        'by/SysTest': labelledSystestTotal,
        Uncovered: criteriaUnreferencedTotal,
        Coverage: `${criteriaReferencedPercent}%`
      })

      const t = new Table()
      t.addRows(categories)

      const tableOutput = t.render()

      // Output it to the console
      console.log(tableOutput)

      if (shouldOutputJenkins || shouldOutputCSV || shouldOutputImage) {
        if (!fs.existsSync('./results')) {
          fs.mkdirSync('./results')
        }

        if (shouldOutputCSV) {
          let csvOutput = Object.keys(categories[0]).join(',')
          categories.forEach(c => {
            csvOutput += `\r\n${Object.values(c).join(',')}`
          })
          fs.writeFileSync('results/output.csv', csvOutput)
        }

        if (shouldOutputImage) {
          console.log(pc.red('Generating image not yet supported'))
        }

        if (shouldOutputJenkins) {
          const skipCategories = ['Category', 'Specs', 'Acceptable']
          const jenkinsLine = Object.entries(categories.pop()).map(([key, value]) => skipCategories.indexOf(key) === -1 ? `*${key}*: ${value}` : '').join('  ').trim()
          fs.writeFileSync('results/jenkins.txt', jenkinsLine)
        }

        console.groupEnd()
      }
    }

    return {
      exitCode,
      res: {
        criteriaTotal,
        criteriaReferencedTotal,
        criteriaUnreferencedTotal,
        criteriaReferencedPercent,
        criteriaUnreferencedPercent,
        unknownCriteriaInTests
      }
    }
  } else {
    console.group('Globs found no files:')
    if (specList.length === 0) {
      console.error(pc.red(`--specs matched no files (${pc.dim(specsGlob)}})`))
    } else {
      console.log(pc.green(`--specs matched ${pc.bold(specList.length)} files (${pc.dim(specsGlob)})`))
    }

    if (testList === 0) {
      console.error(pc.red(`--tests matched no files (${testsGlob}})`))
    } else {
      console.error(pc.red(`--tests matched ${pc.bold(testList.length)} files (${pc.dim(testsGlob)})`))
    }
    console.groupEnd('Globs found no files:')

    return {
      exitCode: 1,
      res: {}
    }
  }
}

module.exports = {
  checkReferences
}
