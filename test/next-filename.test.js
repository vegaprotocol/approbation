const test = require("tape");
const {
  getRandomCode,
  padNumber,
  findLowestNumber,
  nextFilename
} = require("../src/next-filename");
const { quiet, loud } = require("./lib");

test("next-filename: getRandomCode: returns a string", (t) => {
  t.plan(3);
  t.equal(typeof getRandomCode(), "string", "Returns a string");
  t.equal(getRandomCode().length, 4, "Returns a 4 character string");
  t.match(
    getRandomCode(),
    /^[A-Z]+$/,
    "Returns an uppercase string of uppercase letters"
  );
});

test("next-filename: padNumber", (t) => {
  t.plan(5);
  t.equal(typeof padNumber(42), "string", "Returns a string");
  t.equal(padNumber(9876), "9876", "Does not pad a 4 digit number");
  t.equal(padNumber(123), "0123", "Pads a 3 digit number with one zero");
  t.equal(padNumber(42), "0042", "Pads a 2 digit number with two zeros");
  t.equal(padNumber(5), "0005", "Pads a single digit number with three zeros");
});

test("next-filename: findLowestNumber", (t) => {
  t.plan(8);

  t.equal(
    findLowestNumber([1, 3, 5]),
    2,
    "Should return 2 (sorted, middle number)"
  );
  t.equal(
    findLowestNumber([2, 3, 4]),
    1,
    "Should return 1 (sorted, first number)"
  );
  t.equal(
    findLowestNumber([10, 8, 6]),
    1,
    "Should return 1 if it is unused (reverse sort)"
  );
  t.equal(
    findLowestNumber([5, 4, 3]),
    1,
    "Should return 1 if it is unused (reverse sort, long gap"
  );
  t.equal(findLowestNumber([1, 3, 7]), 2, "Should return 2 in a short");
  t.equal(
    findLowestNumber([1, 2, 3, 4, 5, 6, 7]),
    8,
    "Should return next number in a long array"
  );
  t.equal(
    findLowestNumber([1]),
    2,
    "Should return next number in a single item array"
  );
  t.equal(
    findLowestNumber([1, 1001]),
    2,
    "Should return 2 even though there a large number"
  );
});

test('next-filename: correctly detect 0002 as next lowest', t => {
    t.plan(3)
  
    quiet()
    const { exitCode, nextLowest, nextHighest } = nextFilename('./test/next-filename/missing-sequence/**/*.md', '', false)
    loud()
  
    t.equal(exitCode, 0, 'Expected no error')
    t.equal(nextLowest, '0002', '0002 is missing, so it is the lowest available sequence number')
    t.equal(nextHighest, '0004', '0004 is the highest available sequence number')
  })

  test('next-filename: correctly detect 0003 as next lowest, 1002 as next highest', t => {
    t.plan(3)
  
    quiet()
    const { exitCode, nextLowest, nextHighest } = nextFilename('./test/next-filename/big-skip/**/*.md', '', false)
    loud()
  
    t.equal(exitCode, 0, 'Expected no error')
    t.equal(nextLowest, '0004', '0004 is missing, so it is the lowest available sequence number')
    t.equal(nextHighest, '1002', '1002 is the highest available sequence number')
  })

  test('next-filename: no matched files', t => {
    t.plan(3)
  
    quiet()
    const { exitCode, nextLowest, nextHighest } = nextFilename('./test/next-filename/no-files/**/*.md', '', false)
    loud()
  
    t.equal(exitCode, 1, 'Expected an error')
    t.equal(nextLowest, '-', 'no lowest available sequence number, because there are no files')
    t.equal(nextHighest, '-', 'no highest available sequence number, because there are no files')
  })