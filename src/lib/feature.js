/* Features are a lot like categories, except they map together specific
 * acceptance criteria across files in to a single unified feature.
 *
 * As I write this, it feels like it's working against some of the logic
 * that is used to generate codes - so this may lead to an approbation v2.
 */

const { validAcceptanceCriteriaCode } = require(".");

let specFeatures;
let acToFeatureLookup = new Map()

function isFeatureEmpty() {
  if (specFeatures === undefined) {
    return true
  }
  return Object.keys(specFeatures).length === 0;
}

/**
 * Validates a Feature object, presumably read from a features.json type
 * file. Features should have a milestone, and a list of criteria that are
 * in the feature. There is no clever wildcard matching, it's all manual.
 *
 * @param {string} featureName the key of the feature in the features.json file
 * @param {Object} feature an object containing the feature config
 * @returns boolean True if it is valid
 */
function isValidFeature(featureName, feature) {
  // Has a name set
  if (!featureName || !featureName.length) {
    return false
  }

  // Feature must have acceptance criteria and more than 0
  if (!feature.acs || !feature.acs.length) {
    return false;
  }

  // Feature must have a milestone
  if (!feature.milestone || !feature.milestone.length) {
    return false;
  }

  return true;
}

function findDuplicateAcs(arr) {
  return [...new Set(arr.filter((item, index) => arr.indexOf(item) !== index))];
};

function setFeatures(fileFeatures) {
  specFeatures = fileFeatures;
  if (!specFeatures.Unknown) {
    specFeatures.Unknown = { acs: [], milestone: "-", acCount: 0 };
  }

  Object.entries(specFeatures).forEach(([featureName, feature]) => {
    const isValid = isValidFeature(featureName, feature)

    feature.acs.forEach((ac) => {
      const existingMap = acToFeatureLookup.get(ac);
      if (!existingMap) {
        acToFeatureLookup.set(ac, [featureName]);
      } else {
        acToFeatureLookup.set(ac, [...existingMap, featureName]);
      }
    })
  })

  return specFeatures;
}

function getFeatureForAc(ac) {
  const f = acToFeatureLookup.get(ac);

  return f
}

function setOrIncreaseProperty(feature, property, value) {
  let f = (feature.match(validAcceptanceCriteriaCode) ? getFeatureForAc(feature) : feature);

  if (isFeatureEmpty() || !f) {
    f = ['Unknown'];
  }

  f.forEach((feature) => {
    if (specFeatures[feature][property]) {
      specFeatures[feature][property] += value;
    } else {
      specFeatures[feature][property] = value;
    }
  })
}

function logUncoveredForFeature(feature) {
  let f = (feature.match(validAcceptanceCriteriaCode) ? getFeatureForAc(feature) : feature);

  if (isFeatureEmpty() || !f) {
  f = ['Unknown'];
  }

  f.forEach((feat) => {
    if (specFeatures[feat]['uncoveredAcs']) {
        specFeatures[feat]['uncoveredAcs'].add(feature);
      } else {
        specFeatures[feat]['uncoveredAcs'] = new Set([feature]);
      }
    });
}

function increaseCodesForFeature(feature, count) {
  if (isFeatureEmpty()) {
    return false
  }
  setOrIncreaseProperty(feature, "codes", count);
}

function increaseCoveredForFeature(feature, count) {
  if (isFeatureEmpty()) {
    return false
  }
  setOrIncreaseProperty(feature, "covered", count);
}

function increaseFeatureCoveredForFeature(feature, count) {
  if (isFeatureEmpty()) {
    return false
  }
  setOrIncreaseProperty(feature, "featureCovered", count);
}

function increaseSystemTestCoveredForFeature(feature, count) {
  if (isFeatureEmpty()) {
    return false
  }
  setOrIncreaseProperty(feature, "systemTestCovered", count);
}

function increaseUncoveredForFeature(feature, count) {
  if (isFeatureEmpty()) {
    return false
  }
  setOrIncreaseProperty(feature, "uncovered", count);
  logUncoveredForFeature(feature);
}

function increaseSpecCountForFeature(feature) {
  if (isFeatureEmpty()) {
    return false
  }
  setOrIncreaseProperty(feature, "specCount", 1);
}

function increaseAcceptableSpecsForFeature(feature) {
  if (isFeatureEmpty()) {
    return false
  }
  setOrIncreaseProperty(feature, "acceptableSpecCount", 1);
}

module.exports = {
  isValidFeature,
  setFeatures,
  specFeatures,
  increaseAcceptableSpecsForFeature,
  increaseCodesForFeature,
  increaseCoveredForFeature,
  increaseFeatureCoveredForFeature,
  increaseSpecCountForFeature,
  increaseSystemTestCoveredForFeature,
  increaseUncoveredForFeature,
  findDuplicateAcs
};
