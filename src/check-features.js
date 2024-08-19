/**
 * Performs 2 checks on a given feature json file:
 * 1. Checks that there are no duplicate AC codes in a single feature
 * 2. Checks that all ACs exist in the current branch
 */
const fs = require('fs')
const glob = require('fast-glob')
const { ignoreFiles } = require('./lib')
const pc = require('picocolors')
const { gatherSpecs, findDuplicateAcs } = require('./check-references')
const { setFeatures } = require('./lib/feature')

function checkFeatures(paths, featuresPath, ignoreGlob, isVerbose = false) {
  verbose = isVerbose
  const ignoreList = ignoreGlob ? glob.sync(ignoreGlob, {}) : []
  const fileList = ignoreFiles(glob.sync(paths, {}), ignoreList)
  let exitCode = 0
  let res, specs, features
  let allCriteriaInFeatures = []

  if (fileList.length > 0) {
    specs = gatherSpecs(fileList)
    features = setFeatures(JSON.parse(fs.readFileSync(featuresPath)))

    let allCriteriaInSpecs = []
    specs.forEach(spec => {
      allCriteriaInSpecs = allCriteriaInSpecs.concat(spec.criteria)
    })

    Object.keys(features).filter(k => k !== 'Unknown').forEach(key => {
      const c = features[key]
      allCriteriaInFeatures = allCriteriaInFeatures.concat(c.acs)
      const mysteryFeatureAcs = []
      c.acs.forEach(ac => {
        if (allCriteriaInSpecs.indexOf(ac) === -1) {
          mysteryFeatureAcs.push(ac)
        }
      })

      const duplicateAcs = findDuplicateAcs(c.acs);
      if (duplicateAcs.length > 0 || mysteryFeatureAcs.length > 0) {
        console.group(pc.bold(`Feature errors: ${key}`))

        console.group();
        if (duplicateAcs.length > 0) {
          console.log(pc.red(pc.bold(`Duplicate ACs for ${key}(${c.milestone})`)) + ` ${duplicateAcs.join(', ')}`)
        }

        if (mysteryFeatureAcs.length > 0) {
          console.log(pc.red(pc.bold(`Mystery ACs for ${key}(${c.milestone})`)) + ` ${JSON.stringify(mysteryFeatureAcs)} `)
        }

        console.groupEnd()
        console.groupEnd()
        console.log();
        exitCode = 1;
      }
    })

    if (isVerbose) {
      const criteriaNotInFeatures = allCriteriaInSpecs.filter(ac => allCriteriaInFeatures.indexOf(ac) === -1)

      if (criteriaNotInFeatures.length > 0) {
        console.group(pc.yellow(pc.bold(`Criteria in specs, but not in features.json: `)) + `${criteriaNotInFeatures.length} out of ${allCriteriaInSpecs.length}`)
        console.log(pc.yellow(criteriaNotInFeatures.join(', ')))
        console.groupEnd()
        console.log();
        exitCode = 1;
      }
    }
  } else {
    console.error(pc.red(`glob matched no files (${paths})`))
    exitCode = 1
  }

  if (exitCode === 0) {
    console.log(pc.green(pc.bold('All features are good')))
  }

  return {
    exitCode,
    res
  }
}

module.exports = {
  checkFeatures
}
