const pc = require('picocolors')

function ignoreFiles(includeList, ignoreList, category = 'spec') {
  if (ignoreList.length === 0 || !ignoreList) {
    return includeList
  }

  const finalList = includeList.filter(file => ignoreList.indexOf(file) === -1)

  const diff = includeList.length - finalList.length
  const ignoreLog = `Ignore matched ${pc.bold(diff)} ${category} files`

  console.log(pc.yellow(ignoreLog))

  return finalList
}

module.exports = {
  ignoreFiles,
  protocolSpecificationsPath: './protocol/',
  nonProtocolSpecificationsPath: './non-protocol-specs/',
  featurePath: './qa-scenarios/',
  validSpecificationFilename: /^([0-9]{4}(-NP)?)-([A-Z]{4})-([a-z_]+)/,
  validSpecificationPrefix: /^([0-9]{4}(-NP)?-[A-Z]{4})/,
  validAcceptanceCriteriaCode: /([0-9]{4}(-NP)?-[A-Z]{4})-([0-9]{3})/g
}
