/**
 * Checks for cross references between specs and feature files. Specifically, it lists out:
 * - Which acceptance criteria are referred to in a feature file
 * - Which acceptance criteria are not referred to in any feature file
 *
 * This script is pretty ugly. Sorry.
 */
const fs = require('fs')
const glob = require('fast-glob')
const path = require('path')
const pc = require('picocolors')
const { validSpecificationPrefix, validAcceptanceCriteriaCode, ignoreFiles } = require('./lib')
const { getCategoriesForSpec, increaseCodesForCategory, increaseCoveredForCategory, increaseAcceptableSpecsForCategory, increaseUncoveredForCategory, increaseFeatureCoveredForCategory, increaseSystemTestCoveredForCategory, increaseSpecCountForCategory, setCategories } = require('./lib/category')
const { setFeatures, increaseAcceptableSpecsForFeature, increaseCodesForFeature, increaseCoveredForFeature, increaseFeatureCoveredForFeature, increaseSpecCountForFeature, increaseSystemTestCoveredForFeature, increaseUncoveredForFeature, specFeatures, findDuplicateAcs } = require('./lib/feature')
const { Table } = require('console-table-printer')
const { specPriorities } = require('./lib/priority')
const sortBy = require('lodash.sortby')

// Ugly globals
let verbose = false
let showFiles = false

function gatherSpecs(fileList) {
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

    let categories
    try {
      categories = getCategoriesForSpec(codeStart[0])
    } catch (e) {
      categories = [];
    }

    specFiles.set(fileName, {
      name: `${path}${file}`,
      code: codeStart[0],
      file,
      path,
      criteria,
      categories
    })
  })

  return specFiles
}

// Step 2: Gather all the features
function gatherTests(fileList) {
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

function processReferences(specs, tests) {
  let criteriaTotal = 0
  let criteriaReferencedTotal = 0
  let criteriaUnreferencedTotal = 0
  const allCriteriaInSpecs = []

  // Step 3: Output the data
  specs.forEach((value, key) => {
    value.referencedByFeature = 0
    value.referencedBySystemTest = 0

    const unreferencedCriteria = []
    // Used as a title later on
    const category = value.categories && value.categories !== ['Unknown'] ? ' ' + value.categories.filter(c => c !== 'Total').map(c => { return pc.bgYellow(pc.black(`#${c}`)) }).join(', ') : ''
    // Used as a shortcut for all the loops
    const categories = value.categories
    categories.forEach(c => increaseSpecCountForCategory(c))

    const acceptableMinimum = 1

    criteriaTotal += value.criteria.length
    categories.forEach(c => increaseCodesForCategory(c, value.criteria.length))

    let refOutput = ''
    const criteriaWithRefs = []

    // Tally Criteria
    if (value.criteria && value.criteria.length > 0) {
      value.criteria.forEach(c => {
        allCriteriaInSpecs.push(c)
        const linksForAC = tests.get(c)

        if (linksForAC) {
          refOutput += `${pc.green(c)}:  ${linksForAC.length} (${linksForAC.toString()})\r\n`
          criteriaWithRefs.push(c)
          criteriaReferencedTotal++
          categories.forEach(c => increaseCoveredForCategory(c, 1))
          increaseCoveredForFeature(c, 1)

          // Hacky hack: Limit these to 1 or 0 rather than a true tally.
          let criteriaAlreadyLoggedSystest = false
          let criteriaAlreadyLoggedFeature = false
          linksForAC.forEach(l => {
            if (!criteriaAlreadyLoggedSystest && l.match('system-tests')) {
              increaseSystemTestCoveredForFeature(c, 1)
              categories.forEach(c => increaseSystemTestCoveredForCategory(c, 1))
              value.referencedBySystemTest++
              criteriaAlreadyLoggedSystest = true
            } else if (!criteriaAlreadyLoggedFeature && l.match('.feature')) {
              increaseFeatureCoveredForFeature(c, 1)
              categories.forEach(c => increaseFeatureCoveredForCategory(c, 1))
              value.referencedByFeature++
              criteriaAlreadyLoggedFeature = true
            }
          })
        } else {
          categories.forEach(c => increaseCoveredForCategory(c, 0))
        }

        // Delete used references, so that tests at the end contains only AC codes not found in specs
        tests.delete(c)
      })

      if (criteriaWithRefs.length !== value.criteria.length) {
        value.criteria.forEach(v => {
          if (!criteriaWithRefs.includes(v)) {
            increaseUncoveredForFeature(v, 1)
            unreferencedCriteria.push(v)
            criteriaUnreferencedTotal++
          }
        })

        categories.forEach(c => increaseUncoveredForCategory(c, unreferencedCriteria.length))
      }

      if (value.criteria.length > acceptableMinimum) {
        categories.forEach(c => increaseAcceptableSpecsForCategory(c))
      }
    }

    const count = value.criteria.length > acceptableMinimum ? pc.green(value.criteria.length) : pc.red(value.criteria.length)
    const referenced = criteriaWithRefs.length > acceptableMinimum ? pc.green(criteriaWithRefs.length) : pc.red(criteriaWithRefs.length)

    value.count = value.criteria.length
    value.referenced = criteriaWithRefs.length
    value.uncovered = value.count - value.referenced
    value.priority = specPriorities[value.code] || 10

    if (showFiles) {
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
    allCriteriaInSpecs,
    criteriaTotal,
    criteriaReferencedTotal,
    criteriaUnreferencedTotal,
    unknownCriteriaInTests: tests
  }
}

/**
 * This function signature is madness, but refactoring it has yet to be worth the time
 * 
 * @param {*} specsGlob 
 * @param {*} testsGlob 
 * @param {*} categoriesPath 
 * @param {*} ignoreGlob 
 * @param {*} featuresPath 
 * @param {*} showMystery 
 * @param {*} isVerbose 
 * @param {*} showCategoryStats 
 * @param {*} shouldShowFiles 
 * @param {*} shouldOutputCSV 
 * @param {*} shouldOutputJenkins 
 * @param {*} shouldShowFileStats 
 * @param {*} currentMilestone
 * @param {*} outputPath 
 * @returns 
 */
function checkReferences(specsGlob, testsGlob, categoriesPath, ignoreGlob, featuresPath, showMystery = false, isVerbose = false, showCategoryStats = false, shouldShowFiles = false, shouldOutputCSV = false, shouldOutputJenkins = false, shouldShowFileStats = false, currentMilestone = 'colosseo_II', outputPath = './results') {
  verbose = isVerbose
  showFiles = shouldShowFiles
  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const specList = ignoreFiles(glob.sync(specsGlob, {}), ignoreList)
  const testList = ignoreFiles(glob.sync(testsGlob, {}), ignoreList, 'test')
  let categories
  const milestones = new Map()
  const totals = []

  let specs, tests, features, specFeatures
  const exitCode = 0


  if (specList.length > 0 && testList.length > 0) {
    try {
      // Categories gather spec files in to categories, and tally the number of codes in each category
      specCategories = JSON.parse(fs.readFileSync(categoriesPath))
      setCategories(specCategories)
      // Features gather Acceptance Criteria across spec files or categories, and tally the numbers

      if (featuresPath !== undefined && featuresPath.length > 0) {
        specFeatures = setFeatures(JSON.parse(fs.readFileSync(featuresPath)))
      }

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

    const { criteriaTotal, criteriaReferencedTotal, criteriaUnreferencedTotal, unknownCriteriaInTests, allCriteriaInSpecs } = processReferences(specs, tests)
    const criteriaReferencedPercent = (criteriaReferencedTotal / criteriaTotal * 100).toFixed(1)
    const criteriaUnreferencedPercent = (criteriaUnreferencedTotal / criteriaTotal * 100).toFixed(1)

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

    let specsTableRows

    if (shouldShowFileStats) {
      specsTableRows = Array.from(specs.keys()).map(key => {
        const s = specs.get(key)
        const coverage = (s.referenced / s.count * 100).toFixed(1)
        return {
          File: key,
          Priority: s.priority,
          Category: s.category,
          Criteria: s.count,
          Covered: s.referenced,
          'by/FeatTest': s.referencedByFeature,
          'by/SysTest': s.referencedBySystemTest,
          Uncovered: s.uncovered,
          Coverage: `${coverage | '0.0'}%`
        }
      })
      const st = new Table()
      st.addRows(sortBy(specsTableRows, ['Priority', 'Coverage']))
      console.log(st.render())
    }

    if (featuresPath) {
      const milestoneNames = new Set()

      Object.keys(specFeatures).forEach(key => milestoneNames.add(specFeatures[key].milestone))
      milestoneNames.forEach(m => milestones.set(m, []))

      Object.keys(specFeatures).filter(k => k !== 'Unknown').forEach(key => {
        const c = specFeatures[key]
        const coverage = (c.covered / (c.acs.length | 0) * 100).toFixed(1)

        const mysteryFeatureAcs = []
        c.acs.forEach(ac => {
          if (allCriteriaInSpecs.indexOf(ac) === -1) {
            mysteryFeatureAcs.push(ac)
          }
        })

        const duplicateAcs = findDuplicateAcs(c.acs);
        if (duplicateAcs.length > 0 || mysteryFeatureAcs.length > 0 || c.uncovered !== 0) {
          console.group(pc.bold(`Feature errors: ${key}`))

          console.group();
          if (duplicateAcs.length > 0) {
            console.log(pc.red(pc.bold(`Duplicate ACs for ${key}(${c.milestone})`)) + ` ${duplicateAcs.join(', ')}`)
          }

          if (mysteryFeatureAcs.length > 0) {
            console.log(pc.red(pc.bold(`Mystery ACs for ${key}(${c.milestone})`)) + ` ${JSON.stringify(mysteryFeatureAcs)} `)
          }

          if (c.uncovered !== 0 && c.uncoveredAcs) {
            console.log(
              pc.red(`Uncovered ACs for ${key}(${c.milestone}): `) +
              Array.from(c.uncoveredAcs).join(', ')
            )
          }
          console.groupEnd()
          console.groupEnd()
          console.log();
        }


        milestones.get(c.milestone).push({
          Feature: key,
          Milestone: c.milestone || 0,
          acs: c.acs.length || 0,
          Covered: c.covered || 0,
          'by/FeatTest': c.featureCovered || 0,
          'by/SysTest': c.systemTestCovered || 0,
          Uncovered: c.uncovered || 0,
          Coverage: isNaN(coverage) ? '0%' : `${coverage}% `
        })

      })

      const t = new Table()

      milestones.forEach((featuresByMilestone, milestoneKey) => {
        if (milestoneKey === 'unknown') {
          return
        }
        const Covered = featuresByMilestone.reduce((acc, cur) => acc + cur.Covered, 0);
        const acs = featuresByMilestone.reduce((acc, cur) => acc + cur.acs, 0);
        const Coverage = `${(Covered / acs * 100).toFixed(1)}% `
        totals.push({
          Feature: `Total`,
          Milestone: milestoneKey || '-',
          acs,
          Covered,
          'by/FeatTest': featuresByMilestone.reduce((acc, cur) => acc + cur['by/FeatTest'], 0) || '-',
          'by/SysTest': featuresByMilestone.reduce((acc, cur) => acc + cur['by/SysTest'], 0) || '-',
          Uncovered: featuresByMilestone.reduce((acc, cur) => acc + cur.Uncovered, 0) || '-',
          Coverage
        })

        t.addRows(featuresByMilestone);
      })


      t.addRows([{ Feature: '---', Milestone: '---', acs: '---', Covered: '---', 'by/FeatTest': '---', 'by/SysTest': '---', Uncovered: '---', Coverage: '---' }]);
      t.addRows(totals);
      const tableOutput = t.render()
      console.log(tableOutput)
    }

    if (showCategoryStats) {
      const shouldOutputImage = false

      categories = Object.keys(specCategories).map(key => {
        const c = specCategories[key]
        const coverage = (c.covered / c.codes * 100).toFixed(1)

        return {
          Category: key,
          Specs: c.specCount || '-',
          Acceptable: c.acceptableSpecCount ? c.acceptableSpecCount : '-',
          Criteria: c.codes || '-',
          Covered: c.covered || '-',
          'by/FeatTest': c.featureCovered || '-',
          'by/SysTest': c.systemTestCovered || '-',
          Uncovered: c.uncovered || '-',
          Coverage: isNaN(coverage) ? '-' : `${coverage}% `
        }
      })

      const t = new Table()
      t.addRows(categories)
      const tableOutput = t.render()
      console.log(tableOutput)

      if (shouldOutputJenkins || shouldOutputCSV || shouldOutputImage) {
        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath, { recursive: true })
        }

        if (shouldOutputCSV) {
          let categoriesCsvOutput = Object.keys(categories[0]).join(',')
          categories.forEach(c => {
            categoriesCsvOutput += `\r\n${Object.values(c).join(',')} `
          })
          fs.writeFileSync(`${outputPath}/approbation-categories.csv`, categoriesCsvOutput)

          if (shouldShowFileStats) {
            let csvOutputFiles = Object.keys(specsTableRows[0]).join(',')
            specsTableRows.forEach(c => {
              csvOutputFiles += `\r\n${Object.values(c).join(',')}`
            })
            fs.writeFileSync(`${outputPath}/approbation-files.csv`, csvOutputFiles)
          }
        }

        if (shouldOutputJenkins) {
          let cm
          // If current milestone is set by parameter, use it
          if (currentMilestone) {
             cm = totals.find(t => t.Milestone === currentMilestone)
          }
          // If not, use the most recent
          if (!cm) {
            cm = totals && totals.length > 0 ? totals.pop() : false
          }
          
          const skipCategories = ['Category', 'Specs', 'Acceptable']
          let jenkinsLine = `All ACs: ${Object.entries(categories.pop()).map(([key, value]) => skipCategories.indexOf(key) === -1 ? `*${key}*: ${value}` : '').join('  ').trim()}`

          if (cm && cm.Milestone && cm.Coverage) {
            jenkinsLine += `\r\nCurrent milestone ACs: *${cm.Milestone}*: ${cm.Coverage}`
          }
          
          fs.writeFileSync(`${outputPath}/jenkins.txt`, jenkinsLine)
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
        unknownCriteriaInTests,
        categories
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
  gatherSpecs,
  findDuplicateAcs,
  checkReferences
}
