const fs = require('fs')
const pc = require('picocolors')
const git = require('git-rev-sync')

/**
 * Returns all subfolders of the current path
 */
function getDirectories (path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path + '/' + file).isDirectory()
  })
}

/**
 * Pick a relevant colour based on the branch name
 */
function colourCodeBranch (branch) {
  if (branch === 'main' || branch === 'master') {
    return pc.green(branch)
  } else if (branch === 'develop') {
    return pc.yellow(branch)
  } else {
    return pc.red(branch)
  }
}

/**
 * Displays the git branch for projects that will be used
 * Enabled via a command line switch
 *
 * Big bad assumption: subfolders of the current path are projects
 * Better would be to derive projects from the globs - this is the lazy option
 */
function outputBranches () {
  const projects = getDirectories('./')

  console.group(pc.bold('Project branches'))
  projects.forEach(p => {
    try {
      const branch = git.branch(p)
      const commit = git.short(p)
      console.log(`${pc.bold(p)}: ${colourCodeBranch(branch)} @ ${commit}`)
    } catch (e) {
      console.error(`Could not check git branch for ${p}`)
    }
  })
  console.groupEnd()
}

module.exports = {
  outputBranches
}
