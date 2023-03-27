const fs = require('fs')
const Mustache = require('mustache')
const pc = require('picocolors')
const { parse } = require('csv-parse/sync');
const { rimrafSync } = require('rimraf')

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

function generateImageFiles(allCodes, testResults) {

  allCodes.forEach(ac => {
    let source = 'untested'
    if (testResults.has(ac)) {
      const resultForCode = testResults.get(ac)
      if (resultForCode === 'pass') {
        source = 'pass'
      } else if (resultForCode === 'fail') {
        source = 'fail'
      } else if (resultForCode === 'mix') {
        source = 'mixed'
      }
    }
    fs.copyFileSync(`./assets/icons/${source}.svg`, `./build/status/${ac}.svg`)
  })

}

function generateHTML(allCodes, testResults){
  const template = fs.readFileSync('./templates/template.mustache', { encoding: 'utf-8' }).toString()
  const partials = {
    stylesheet: fs.readFileSync('./templates/partials/stylesheet.mustache', { encoding: 'utf-8' }).toString(),
    footer: fs.readFileSync('./templates/partials/footer.mustache', { encoding: 'utf-8' }).toString(),
    codes: fs.readFileSync('./templates/partials/codes.mustache', { encoding: 'utf-8' }).toString(),
  }

  const html = Mustache.render(template, { allCodes, testResults }, partials)
  const res = fs.writeFileSync('./build/index.html', html)
  return res
}

function checkCoverage(paths, ignoreGlob, isVerbose = false) {
  verbose = isVerbose
  isVerbose && console.log(`Cleaning previous build`)

  rimrafSync('./build/index.html')
  rimrafSync('./build/status/*')
  
  let exitCode = 0
  let res = {
    testResults: undefined,
    allCodes: undefined
  }

  isVerbose && console.log(`Opening coverage log:`)
  res.testResults = gatherCoverage()
  isVerbose && console.log(pc.green(`- Got ${res.testResults.resultsByAc.size} results`))

  isVerbose && console.log(`Opening code list:`)
  res.allCodes = gatherAllCodes()
  isVerbose && console.log(pc.green(`- Got ${res.allCodes.length} codes`))

  isVerbose && console.log(pc.yellow(`Generating status images...`))
  generateImageFiles(res.allCodes, res.testResults.resultsByAc)

  isVerbose && console.log(pc.yellow(`Generating HTML...`))
  generateHTML(res.allCodes, res.testResults.resultsByAc)

  console.log(pc.green(pc.bold(`\r\nDone`)))

  return {
    exitCode,
    res
  }
}

module.exports = {
  checkCoverage
}
