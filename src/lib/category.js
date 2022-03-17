const specCategories = {
   'Fundamentals': {
     'specs': ['0017-PART', '0022-AUTH', '0051-PROD', '0016-PFUT', '0053-PERP', '0040-ASSF', '0013-ACCT', '0028-GOVE', '0054-NETP', '0068-MATC', '0067-KEYS', '0057-TRAN', '0052-FPOS']
   },
   'Markets': {
     'specs': ['0035-LIQM', '0032-PRIM', '0043-MKTL', '0026-AUCT', '0006-POSI', '0008-TRAD', '0001-MKTF', '0009-MRKP', '0012-POSR', '0021-MDAT', '0039-MKTD', '0070-MKTD']
   },
   'Settlement': {
     'specs': ['0002-STTL', '0003-MTMK']
   },
   'Protections': {
     'specs': ['0062-SPAM', '0060-WEND', '0003-NP-LIMI', '0005-NP-LIMN']
   },
   'Liquidity': {
     'specs': ['0044-LIQM', '0042-LIQF', '0034-PROB']
   },
   'Governance': {
     'specs': ['0028-GOVE', '0027-ASSP', '0059-STKG', '0058-REWS', '0056-REWA', '0055-TREA']
   },
   'Orders': {
     'specs': ['0014-ORDT', '0004-AMND', '0024-OSTA', '0025-OCRE', '0037-OPEG', '0033-OCAN', '0038-OLIQ']
   },
   'Margin': {
     'specs': ['0029-FEES', '0005-COLL', '0010-MARG', '0011-MARA', '0015-INSR', '0019-MCAL', '0018-RSKM', '0023-CALI']
   },
   'Oracles': {
     'specs': ['0045-DSRC', '0046-DSRM', '0047-DSRF', '0048-DSRI']
   },
   'Bridges': {
     'specs': ['0049-TVAL', '0050-EPOC', '0030-ETHM', '0031-ETHB']
   },
   'Staking & Validators': {
     'specs': ['0059-STKG', '0056-REWA', '0061-REWP', '0058-REWS', '0055-TREA', '0041-TSTK', '0069-VCBS', '0066-VALW', '0065-FTCO', '0064-VALP', '0063-VALK']
   },
   'Architecture': {
     'specs': ['0036-BRIE', '0009-NP-SNAP']
   },
   'Data': {
     'specs': ['0020-APIS', '0007-POSN']
   },
   'Unknown': {
     'specs': []
   }
}

function getCategoryForSpec(code) {
  const categories = Object.keys(specCategories).filter(category => {
    return (specCategories[category].specs.indexOf(code) !== -1)
  })

  // There shouldn't be more than one. But if there is, take the first one.
  return (categories.length > 0) ? categories[0] : 'Unknown'
}

function setOrIncreaseProperty(category, property, value) {

  if (specCategories[category][property]) {
    specCategories[category][property] += value
  } else {
    specCategories[category][property] = value
  }
}

function increaseCodesForCategory(category, count) {
  setOrIncreaseProperty(category, 'codes', count)
}

function increaseCoveredForCategory(category, count) {
  setOrIncreaseProperty(category, 'covered', count)
}

function increaseFeatureCoveredForCategory(category, count) {
  setOrIncreaseProperty(category, 'featureCovered', count)
}

function increaseSystemTestCoveredForCategory(category, count) {
  setOrIncreaseProperty(category, 'systemTestCovered', count)
}

function increaseUncoveredForCategory(category, count) {
  setOrIncreaseProperty(category, 'uncovered', count)
}

function increaseSpecCountForCategory(category) {
  setOrIncreaseProperty(category, 'specCount', 1)
}

function increaseAcceptableSpecsForCategory(category) {
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
  increaseAcceptableSpecsForCategory
}