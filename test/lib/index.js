/* Quick hacky silence output for tests */
const log = console.log
const warn = console.warn
const error = console.error
const dir = console.dir
const group = console.group
const groupEnd = console.groupEnd

function quiet () {
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
  console.dir = () => {}
  console.group = () => {}
  console.groupEnd = () => {}
}

function loud () {
  console.log = log
  console.warn = warn
  console.error = error
  console.dir = dir
  console.group = group
  console.groupEnd = groupEnd
}

module.exports = {
  quiet,
  loud
}
