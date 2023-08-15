const fs = require('fs')
const Mustache = require('mustache')
const pc = require('picocolors')
const { parse } = require('csv-parse/sync')
const { rimrafSync } = require('rimraf')
const findRoot = require('find-root')
const appDir = findRoot()
const { setFeatures, getFeatureForAc, getMilestoneForAc } = require('./lib/feature')

// Outputs acceptance criteria count if it's acceptable
function gatherCoverage() {
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

function gatherAllCodes() {
  const fileContents = fs.readFileSync('./test/test-data/approbation-codes.csv')
  return parse(fileContents, {
    columns: ['Code', 'Source', 'Systests', 'Definition'],
    skip_empty_lines: true
  })
}

function generateImageFiles(allCodes, testResults) {
  allCodes.forEach(ac => {
    let source = 'untested-uncovered'
    if (testResults.has(ac.Code)) {
      const resultForCode = testResults.get(ac.Code)
      if (resultForCode === 'pass') {
        source = 'pass'
      } else if (resultForCode === 'fail' || resultForCode === 'mix') {
        source = 'fail'
      }
    } else {
      if (ac.Systests === 'true') {
        source = 'untested-covered'
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

function generateHTML(allCodes, testResults, Features, Milestones) {
  const template = fs.readFileSync(`${appDir}/templates/template.mustache`, { encoding: 'utf-8' }).toString()
  const partials = {
    stylesheet: fs.readFileSync(`${appDir}/templates/partials/stylesheet.mustache`, { encoding: 'utf-8' }).toString(),
    footer: fs.readFileSync(`${appDir}/templates/partials/footer.mustache`, { encoding: 'utf-8' }).toString(),
    codes: fs.readFileSync(`${appDir}/templates/partials/codes.mustache`, { encoding: 'utf-8' }).toString(),
    filters: fs.readFileSync(`${appDir}/templates/partials/filters.mustache`, { encoding: 'utf-8' }).toString()
  }

  Features.delete(undefined)
  Milestones.delete(undefined)

  const html = Mustache.render(template, {
    allCodes,
    testResults,
    Features: [...Features],
    Milestones: [...Milestones]
  }, partials)
  const res = fs.writeFileSync(`${appDir}/build/index.html`, html)
  return res
}

function getPassingLabel(status, hasSystests) {
  if (status === 'pass') {
    return 'Test(s) reference this AC and all are passsing'
  } else if (status === 'fail') {
    return 'Test(s) reference this AC and all are failing'
  } else if (status === 'mix') {
    return 'Test(s) reference this AC and some are failing'
  } else {
    if (hasSystests === 'true') {
      return 'Tests reference this criteria but they are not running'
    } else {
      return 'No tests reference this criteria'
    }
  }
}

function checkCoverage(paths, ignoreGlob, featuresPath, isVerbose = false) {
  const Features = new Set()
  const Milestones = new Set()
  let specFeatures
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

  if (featuresPath !== undefined && featuresPath.length > 0) {
    specFeatures = setFeatures(JSON.parse(fs.readFileSync(featuresPath)))
  }

  isVerbose && console.log('Opening coverage log:')
  res.testResults = gatherCoverage()
  isVerbose && console.log(pc.green(`- Got ${res.testResults.resultsByAc.size} results`))

  isVerbose && console.log('Opening code list:')
  res.allCodes = gatherAllCodes()
  isVerbose && console.log(pc.green(`- Got ${res.allCodes.length} codes`))

  res.allCodes.forEach(e => {
    const source = e.Definition.match(/(protocol|non-protocol-specs)\/([\w\-.]*)/);
    let p
    if (source) {
      p = `<a target="_blank" href="https://github.com/vegaprotocol/specs/blob/master/${source[1]}/${source[2]}#${e.Code}">${source[2]}</a>`
    } else {
      p = e.Definition
    }

    e.Feature = getFeatureForAc(e.Code)
    Features.add(e.Feature)
    e.Milestone = getMilestoneForAc(e.Code)
    Milestones.add(e.Milestone)

    const r = res.testResults.resultsByAc.get(e.Code);
    e.Passing = r || 'unknown';
    e.PassingLabel = getPassingLabel(r, e.Systests)
    e.className = `${e.Passing} ${e && e.Systests === 'true' ? 'tested' : 'untested'}`;
    e.CoveredLabel = e.Systests === 'true' ? 'Is covered by one or more system tests' : 'No system tests cover this';
    e.Definition = p
  });

  isVerbose && console.log(pc.yellow('Generating status images...'))
  generateImageFiles(res.allCodes, res.testResults.resultsByAc)

  isVerbose && console.log(pc.yellow('Generating HTML...'))
  generateHTML(res.allCodes, res.testResults.resultsByAc, Features, Milestones)

  console.log(pc.green(pc.bold('\r\nDone')))

  return {
    exitCode,
    res
  }
}

module.exports = {
  checkCoverage
}