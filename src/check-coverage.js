const fs = require('fs')
const Mustache = require('mustache')
const pc = require('picocolors')
const { parse } = require('csv-parse/sync')
const { rimrafSync } = require('rimraf')
const findRoot = require('find-root')
const appDir = findRoot()

// Outputs acceptance criteria count if it's acceptable
function gatherCoverage () {
  const res = new Map()
  const fileContents = fs.readFileSync('./test/test-data/coverage-report.csv')
  const rows = parse(fileContents, {
    columns: ['Test', 'File', 'Criteria', 'Status'],
    skip_empty_lines: true
  }).map(r => {
    r.Criteria = r.Criteria.split('/')
    return r
  })

  rows.forEach(r => {
    const result = r.Status
    r.Criteria.forEach(c => {
      if (res.has(c)) {
        const arr = res.get(c)
        arr.push({ test: r.Test, result: result })
        res.set(c, arr)
      } else {
        res.set(c, [{ test: r.Test, result: result }])
      }
    })
  })

  const resultsByAc = new Map()
  for (const [key, value] of res) {
    const allPassed = new Set(value.map(r => r.result))
    const summary = (allPassed.size === 1 && allPassed.has('Passed')) ? 'pass' : (allPassed.size === 1 && allPassed.has('Failed')) ? 'fail' : 'mix'

    resultsByAc.set(key, summary)
  }

  return {
    done: true,
    resultsByAc
  }
}

function gatherAllCodes () {
  const fileContents = fs.readFileSync('./test/test-data/approbation-codes.csv')
  return parse(fileContents, {
    columns: ['Code', 'Source', 'Systests', 'Definition'],
    skip_empty_lines: true
  })
}

function generateImageFiles (allCodes, testResults) {
  console.log(process.cwd())

  allCodes.forEach(ac => {
    let source = 'untested'
    if (testResults.has(ac.Code)) {
      const resultForCode = testResults.get(ac.Code)
      if (resultForCode === 'pass') {
        source = 'pass'
      } else if (resultForCode === 'fail' || resultForCode === 'mix') {
        source = 'fail'
      }
    }

    fs.copyFileSync(`${appDir}/assets/icons/${source}.svg`, `${appDir}/build/status/${ac.Code}.svg`)

    if (ac.Systests === 'true') {
      fs.copyFileSync(`${appDir}/assets/icons/has-tests.svg`, `${appDir}/build/status/${ac.Code}-tested.svg`)
    } else {
      fs.copyFileSync(`${appDir}/assets/icons/no-tests.svg`, `${appDir}/build/status/${ac.Code}-tested.svg`)
    }
  })
}

function generateHTML (allCodes, testResults) {
  const template = fs.readFileSync(`${appDir}/templates/template.mustache`, { encoding: 'utf-8' }).toString()
  const partials = {
    stylesheet: fs.readFileSync(`${appDir}/templates/partials/stylesheet.mustache`, { encoding: 'utf-8' }).toString(),
    footer: fs.readFileSync(`${appDir}/templates/partials/footer.mustache`, { encoding: 'utf-8' }).toString(),
    codes: fs.readFileSync(`${appDir}/templates/partials/codes.mustache`, { encoding: 'utf-8' }).toString(),
    filters: fs.readFileSync(`${appDir}/templates/partials/filters.mustache`, { encoding: 'utf-8' }).toString()
  }

  const html = Mustache.render(template, { allCodes, testResults }, partials)
  const res = fs.writeFileSync(`${appDir}/build/index.html`, html)
  return res
}

function checkCoverage (paths, ignoreGlob, isVerbose = false) {
  isVerbose && console.log('Cleaning previous build')

  if (fs.existsSync(`${appDir}/build`)) {
    rimrafSync(`${appDir}/build/index.html`)

    if (fs.existsSync(`${appDir}/build/status`)) {
      rimrafSync(`${appDir}/build/status/*`)
    } else {
      fs.mkdirSync(`${appDir}/build/status/`)
    }
  } else {
    fs.mkdirSync(`${appDir}/build/`)
    fs.mkdirSync(`${appDir}/build/status/`)
  }

  const exitCode = 0
  const res = {
    testResults: undefined,
    allCodes: undefined
  }

  isVerbose && console.log('Opening coverage log:')
  res.testResults = gatherCoverage()
  isVerbose && console.log(pc.green(`- Got ${res.testResults.resultsByAc.size} results`))

  isVerbose && console.log('Opening code list:')
  res.allCodes = gatherAllCodes()
  isVerbose && console.log(pc.green(`- Got ${res.allCodes.length} codes`))
  res.allCodes.forEach(e => {
    const r = res.testResults.resultsByAc.get(e.Code)
    e.Passing = r || 'unknown'
    e.PassingLabel = r && r === 'pass' ? 'Passing' : e.Passing === 'unknown' ? 'Unknown' : 'Failing or mixed'
    e.className = `${e.Passing} ${e && e.Systests === 'true' ? 'tested' : 'untested'}`
    e.CoveredLabel = e.Systests === 'true' ? 'Is covered by one or more system tests' : 'No system tests cover this'
  })

  isVerbose && console.log(pc.yellow('Generating status images...'))
  generateImageFiles(res.allCodes, res.testResults.resultsByAc)

  isVerbose && console.log(pc.yellow('Generating HTML...'))
  generateHTML(res.allCodes, res.testResults.resultsByAc)

  console.log(pc.green(pc.bold('\r\nDone')))

  return {
    exitCode,
    res
  }
}

module.exports = {
  checkCoverage
}
