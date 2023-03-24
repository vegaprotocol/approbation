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

  for (const [key, value] of res) {
    const allPassed = new Set(value.map(r => r.result))
    const summary = (allPassed.size === 1 && allPassed.has('Passed')) ? 'pass' : 'fail'
    console.log(`${key}: ${summary}`);
  }


  return {
    done: true
  }
}

function checkCoverage(paths, ignoreGlob, isVerbose = false) {
  verbose = isVerbose
  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const fileList = ignoreFiles(glob.sync(paths, {}), ignoreList)
  let exitCode = 0
  let res

  if (fileList.length > 0) {
    res = gatherCoverage()
    console.log('\r\n--------------------------------------------------')
    console.log('\r\n\r\n')
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
