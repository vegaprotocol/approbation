// This should be committed as a JSON file to the specs repo - but for now, this will do
const ErrorCategoriesEmpty = new Error('Categories have not been set')
let specCategories

function isCategoriesEmpty() {
  if (specCategories === undefined) {
    throw ErrorCategoriesEmpty
  }
  return Object.keys(specCategories).length === 0 
}

function setCategories(categories) {
  specCategories = categories
  if (!specCategories['Unknown']) {
    specCategories['Unknown'] = { specs: [], specCount: 0 }
  }
}

function getCategoryForSpec(code) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  }

  const categories = Object.keys(specCategories).filter(category => {
    return (specCategories[category].specs.indexOf(code) !== -1)
  })

  // There shouldn't be more than one. But if there is, take the first one.
  return (categories.length > 0) ? categories[0] : 'Unknown'
}

function setOrIncreaseProperty(category, property, value) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  }
  
  if (specCategories[category][property]) {
    specCategories[category][property] += value
  } else {
    specCategories[category][property] = value
  }
}

function increaseCodesForCategory(category, count) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  }
  setOrIncreaseProperty(category, 'codes', count)
}

function increaseCoveredForCategory(category, count) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  }  
  setOrIncreaseProperty(category, 'covered', count)
}

function increaseFeatureCoveredForCategory(category, count) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  } 
  setOrIncreaseProperty(category, 'featureCovered', count)
}

function increaseSystemTestCoveredForCategory(category, count) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  } 
  setOrIncreaseProperty(category, 'systemTestCovered', count)
}

function increaseUncoveredForCategory(category, count) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  } 
  setOrIncreaseProperty(category, 'uncovered', count)
}

function increaseSpecCountForCategory(category) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  } 
  setOrIncreaseProperty(category, 'specCount', 1)
}

function increaseAcceptableSpecsForCategory(category) {
  if (isCategoriesEmpty()) {
    throw ErrorCategoriesEmpty
  } 
  setOrIncreaseProperty(category, 'acceptableSpecCount', 1)
}

module.exports = {
  specCategories,
  getCategoryForSpec,
  increaseCodesForCategory,
  increaseCoveredForCategory,
  increaseUncoveredForCategory,
  increaseSpecCountForCategory,
  increaseSystemTestCoveredForCategory,
  increaseFeatureCoveredForCategory,
  increaseAcceptableSpecsForCategory,
  setCategories
}
