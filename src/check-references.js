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
const { protocolSpecificationsPath, validSpecificationPrefix, validAcceptanceCriteriaCode, nonProtocolSpecificationsPath } = require('./lib')

function gatherSpecs (fileList) {
  // Step 1: Gather all the initial details
  const specFiles = new Map()


  fileList.forEach(file => {
    const fileName = path.basename(file)

    if (fileName !== 'README.md') {
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
    }
  })

  return specFiles
}


// Step 2: Gather all the features
function gatherTests (fileList) {
  const linksInFeatures = new Map()

  fileList.forEach(file => {
    const fileName = path.basename(file)
    if (fileName !== 'README.md') {
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
    }
  })

  return linksInFeatures
}


function processReferences(specs, tests) {
  let criteriaTotal = 0
  let criteriaReferencedTotal = 0
  let criteriaUnreferencedTotal = 0
  // Step 3: Output the data
  specs.forEach((value, key) => {
    console.group(key)
    console.log(`File:          ${value.path}${value.file}`)
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
  const fileList = glob.sync(specsGlob, {})
  let exitCode = 0

  if (fileList.length > 0) {
    const specs = gatherSpecs(fileList)
    const tests = gatherTests(fileList)

    const { criteriaTotal, criteriaReferencedTotal, criteriaUnreferencedTotal } = processReferences(specs, tests)
    const criteriaReferencedPercent = Math.round(criteriaReferencedTotal / criteriaTotal * 100)
    const criteriaUnreferencedPercent = Math.round(criteriaUnreferencedTotal / criteriaTotal * 100)

    console.log(`Total criteria:       ${criteriaTotal}`)
    console.log(`With references:      ${criteriaReferencedTotal} (${criteriaReferencedPercent}%)`)
    console.log(`Without references:   ${criteriaUnreferencedTotal} (${criteriaUnreferencedPercent}%)`)
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
    return {
      exitCode: 1,
      res: {}
    }
  }
}


module.exports = {
  checkReferences
}