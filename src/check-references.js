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
const { validSpecificationPrefix, validAcceptanceCriteriaCode } = require('./lib')

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
    console.group(pc.bold(key))
    console.log(`File:          ${value.file}`)
    console.log(`Criteria:      ${value.criteria.length}`)
    criteriaTotal += value.criteria.length

    // Tally Criteria
    if (value.criteria && value.criteria.length > 0) {
      const criteriaWithRefs = []
      let refOutput = ''
      value.criteria.forEach(c => {
        const linksForAC = tests.get(c)
        if (linksForAC) {
          refOutput += `${c}:  ${linksForAC.length} (${linksForAC.toString()})\r\n`
          criteriaWithRefs.push(c)
          criteriaReferencedTotal++
        }
      })

      if (refOutput.length > 0) {
        console.group('Feature references')
        console.log(refOutput)
        console.groupEnd('Feature references')
      }

      if (criteriaWithRefs.length !== value.criteria.length) {
        const unreferencedCriteria = []

        value.criteria.forEach(v => {
          if (!criteriaWithRefs.includes(v)) {
            unreferencedCriteria.push(v)
            criteriaUnreferencedTotal++
          }
        })
        console.log(`Unreferenced ACs: ${unreferencedCriteria.join(', ')}`)
      }
    }
    console.groupEnd(key)
    console.log(' ')
  })

  return {
    criteriaTotal,
    criteriaReferencedTotal,
    criteriaUnreferencedTotal
  }
}

function checkReferences (specsGlob, testsGlob) {
  const specList = glob.sync(specsGlob, {})
  const testList = glob.sync(testsGlob, {})
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

    const { criteriaTotal, criteriaReferencedTotal, criteriaUnreferencedTotal } = processReferences(specs, tests)
    const criteriaReferencedPercent = Math.round(criteriaReferencedTotal / criteriaTotal * 100)
    const criteriaUnreferencedPercent = Math.round(criteriaUnreferencedTotal / criteriaTotal * 100)

    console.log(pc.bold('Total criteria') + `:       ${criteriaTotal}`)
    console.log(pc.green(pc.bold('With references')) + `:      ${criteriaReferencedTotal} (${criteriaReferencedPercent}%)`)
    console.log(pc.red(pc.bold('Without references')) + `:   ${criteriaUnreferencedTotal} (${criteriaUnreferencedPercent}%)`)
    return {
      exitCode,
      res: {
        criteriaTotal,
        criteriaReferencedTotal,
        criteriaUnreferencedTotal,
        criteriaReferencedPercent,
        criteriaUnreferencedPercent
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
      console.error(pc.red(`--tets matched no files (${testsGlob}})`))
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
