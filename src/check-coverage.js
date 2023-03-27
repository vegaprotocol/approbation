const fs = require('fs')
const glob = require('glob')
const path = require('path')
const { validSpecificationPrefix, ignoreFiles } = require('./lib')
const { minimumAcceptableACsPerSpec } = require('./config')
const pc = require('picocolors')
const { parse } = require('csv-parse/sync');

// Outputs acceptance criteria count if it's acceptable
let verbose = false

function gatherCoverage() {
  const res = new Map()
  const fileContents = fs.readFileSync('./test/test-data/coverage-report.csv')
  const rows = parse(fileContents, {
    columns: ['Test', 'File', 'Criteria', 'Status'],
    skip_empty_lines: true
  }).map(r => {
    r['Criteria'] = r['Criteria'].split('/')
    return r
  });

  rows.forEach(r => {
    const result = r['Status']
    r['Criteria'].forEach(c => {
      if (res.has(c)) {
        const arr = res.get(c)
        arr.push({ test: r['Test'], result: result })
        res.set(c, arr)
      } else {
        res.set(c, [{ test: r['Test'], result: result }])
      }
    })
  })


  const resultsByAc = new Map()
  for (const [key, value] of res) {
    const allPassed = new Set(value.map(r => r.result))
    const summary = (allPassed.size === 1 && allPassed.has('Passed')) ? 'pass' :  (allPassed.size === 1 && allPassed.has('Failed')) ? 'fail' : 'mix'

    resultsByAc.set(key, summary) 
  }


  return {
    done: true,
    resultsByAc
  }
}

function gatherAllCodes() {
  const res = new Map()
  const fileContents = fs.readFileSync('./test/test-data/approbation-codes.csv')
  const rows = parse(fileContents, {
    columns: ['Code', 'Source'],
    skip_empty_lines: true
  })

  return rows.map(r => r['Code'])
}

function generateFiles(allCodes, testResults) {
  allCodes.forEach(ac => {
    if (testResults.has(ac)) {
      const resultForCode = testResults.get(ac)
      if (resultForCode === 'pass') {
        console.log(`${ac}: pass`)
      } else if (resultForCode === 'fail') {
        console.log(`${ac}: fail`)
      } else if (resultForCode === 'mix') {
        console.log(`${ac}: mix`)
      }
    } else {
      console.log(`${ac}: unknown`)
    }
  })
}

function checkCoverage(paths, ignoreGlob, isVerbose = false) {
  verbose = isVerbose
  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const fileList = ignoreFiles(glob.sync(paths, {}), ignoreList)
  let exitCode = 0
  let res = {
    testResults: undefined,
    allCodes: undefined
  }

  if (fileList.length > 0) {
    res.testResults = gatherCoverage()
    res.allCodes = gatherAllCodes()
    generateFiles(res.allCodes, res.testResults.resultsByAc)
  } else {
    console.error(pc.red(`glob matched no files (${paths})`))
    exitCode = 1
  }

  return {
    exitCode,
    res
  }
}

module.exports = {
  checkCoverage
}
