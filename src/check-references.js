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
const { setFeatures, increaseCoveredForFeature, increaseFeatureCoveredForFeature, increaseSystemTestCoveredForFeature, increaseUncoveredForFeature, findDuplicateAcs } = require('./lib/feature')
const { Table } = require('console-table-printer')
const sortBy = require('lodash.sortby')

// can be overriden by passing in --current-milestone, this is set for an easy transition while Jenkins doesn't
// have that param - see vegaprotocol/jenkins-shared-library/issues/751 
const DEFAULT_CURRENT_MILESTONE = 'colosseo_II'

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

    specFiles.set(fileName, {
      name: `${path}${file}`,
      code: codeStart[0],
      file,
      path,
      criteria
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
    // Used as a shortcut for all the loops

    criteriaTotal += value.criteria.length

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
          increaseCoveredForFeature(c, 1)

          // Hacky hack: Limit these to 1 or 0 rather than a true tally.
          let criteriaAlreadyLoggedSystest = false
          let criteriaAlreadyLoggedFeature = false
          linksForAC.forEach(l => {
            if (!criteriaAlreadyLoggedSystest && l.match('system-tests')) {
              increaseSystemTestCoveredForFeature(c, 1)
              value.referencedBySystemTest++
              criteriaAlreadyLoggedSystest = true
            } else if (!criteriaAlreadyLoggedFeature && l.match('.feature')) {
              increaseFeatureCoveredForFeature(c, 1)
              value.referencedByFeature++
              criteriaAlreadyLoggedFeature = true
            }
          })
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
      }
    }

    const count = pc.green(value.criteria.length)
    const referenced = pc.green(criteriaWithRefs.length)

    value.count = value.criteria.length
    value.referenced = criteriaWithRefs.length
    value.uncovered = value.count - value.referenced

      const tally = ` has ${count} ACs of which ${referenced} are tested`

      console.log(`${pc.bold(key)}`)
        console.group()
        console.log(`File:          ${value.file}`)
        console.log(`Unreferenced ACs: ${unreferencedCriteria.join(', ')}`)
        if (refOutput.length > 0) {
          console.group(pc.green(pc.bold('Test references')))
          console.log(refOutput)
          console.groupEnd()
        }
        console.groupEnd()
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
 * @param {*} ignoreGlob 
 * @param {*} featuresPath 
 * @param {*} currentMilestone
 * @param {*} outputPath 
 * @returns 
 */
function checkReferences(specsGlob, testsGlob, ignoreGlob, featuresPath, currentMilestone = DEFAULT_CURRENT_MILESTONE, outputPath = './results') {
  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const specList = ignoreFiles(glob.sync(specsGlob, {}), ignoreList)
  const testList = ignoreFiles(glob.sync(testsGlob, {}), ignoreList, 'test')
  const milestones = new Map()
  const totals = []

  let specs, tests, specFeatures
  const exitCode = 0


  if (specList.length > 0 && testList.length > 0) {
    try {
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

    console.log(pc.bold('Total criteria') + `:       ${criteriaTotal}`)
    console.log(pc.green(pc.bold('With references')) + `:      ${criteriaReferencedTotal} (${criteriaReferencedPercent}%)`)
    console.log(pc.red(pc.bold('Without references')) + `:   ${criteriaUnreferencedTotal} (${criteriaUnreferencedPercent}%)`)

    let specsTableRows = Array.from(specs.keys()).map(key => {
        const s = specs.get(key)
        const coverage = (s.referenced / s.count * 100).toFixed(1)
        return {
          File: key,
          Criteria: s.count,
          Covered: s.referenced,
          'by/FeatTest': s.referencedByFeature,
          'by/SysTest': s.referencedBySystemTest,
          Uncovered: s.uncovered,
          Coverage: `${coverage | '0.0'}%`
        }
      })
      const st = new Table()
      st.addRows(sortBy(specsTableRows, ['Coverage']))
      console.log(st.render())

    if (featuresPath) {
      const milestoneNames = new Set()

      Object.keys(specFeatures).forEach(key => milestoneNames.add(specFeatures[key].milestone))
      milestoneNames.forEach(m => milestones.set(m, []))

      Object.keys(specFeatures).filter(k => k !== 'Unknown').forEach(key => {
        const c = specFeatures[key]
        const coverage = (c.covered / (c.acs.length | 0) * 100).toFixed(1)

        const duplicateAcs = findDuplicateAcs(c.acs);
        if (duplicateAcs.length > 0 || c.uncovered !== 0) {
          console.group(pc.bold(`Feature errors: ${key}`))

          console.group();
          if (duplicateAcs.length > 0) {
            console.log(pc.red(pc.bold(`Duplicate ACs for ${key}(${c.milestone})`)) + ` ${duplicateAcs.join(', ')}`)
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

        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath, { recursive: true })
        }

          let cm
          // If current milestone is set by parameter, use it
          if (currentMilestone) {
             cm = totals.find(t => t.Milestone === currentMilestone)
          }
          // If not, use the most recent
          if (!cm) {
            cm = totals && totals.length > 0 ? totals.pop() : false
          }
          
          let jenkinsLine = `Total ACs: ${criteriaTotal}, Referenced ACs: ${criteriaReferencedTotal}, Unreferenced ACs: ${criteriaUnreferencedTotal}, Coverage: ${criteriaReferencedPercent}%`
          if (cm && cm.Milestone && cm.Coverage) {
            jenkinsLine += `\r\nCurrent milestone ACs: *${cm.Milestone}*: ${cm.Coverage}`
          }
          
          fs.writeFileSync(`${outputPath}/jenkins.txt`, jenkinsLine)

        console.groupEnd()

    return {
      exitCode,
      res: {
        criteriaTotal,
        criteriaReferencedTotal,
        criteriaUnreferencedTotal,
        criteriaReferencedPercent,
        criteriaUnreferencedPercent,
        unknownCriteriaInTests,
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
