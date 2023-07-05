const test = require("tape");
const {
  nextCode,
  sample,
  extractPrefixFromCodes,
  extractSequenceFromCodes
} = require("../src/next-code");
const { quiet, loud } = require("./lib");

test("next-code: sample: returns a random array element", (t) => {
  t.plan(6);
  t.equal(sample([1]), 1, "Returns the only element in a single element array (number)");
  t.equal(sample(["2"]), "2", "Returns the only element in a single element array (string)");

  const arr = [1, 2, 3, 4, 5];
  const res = sample(arr);
  t.ok(arr.includes(res), `Random element ${res} is in the array ${JSON.stringify(arr)}`);
  t.throws(() => { return sample([]) }, "Cannot sample from an empty array", "throws an error for empty array")
  t.throws(() => { return sample({}) }, "Cannot sample from an empty array", "throws an error for object")
  t.throws(() => { return sample(undefined) }, "Cannot sample from an empty array", "throws an error for undefined")
});

test("next-code: extractSequenceFromCodes: returns unique codes in array", (t) => {
  t.plan(7);
  t.deepEqual(extractPrefixFromCodes(["0001-TEST-001"]), ["0001-TEST"], "Returns the only element in a single element array (number)");
  t.deepEqual(extractPrefixFromCodes(["0001-TEST-001", "0001-TEST-002"]), ["0001-TEST"], "Returns only unique codes");
  t.deepEqual(extractPrefixFromCodes(["0001-TEST-001", "invalid"]), ["0001-TEST"], "Returns only valid prefixes codes");
  t.deepEqual(extractPrefixFromCodes(["0001-TEST-001", "0001-SAMP-002"]), ["0001-TEST",  "0001-SAMP"], "Returns all results");

  t.deepEqual(extractPrefixFromCodes([]), [], "returns empty array for empty array");
  t.deepEqual(extractPrefixFromCodes({}), [], "returns empty array for non array");
  t.deepEqual(extractPrefixFromCodes(undefined), [], "returns empty array for undefined");
});

test("next-code: extractPrefixFromCodes: returns all unique prefixes found", (t) => {
  t.plan(8);
  t.deepEqual(extractSequenceFromCodes(["0001-TEST-001"]), ["001"], "Returns the only element in a single element array (number)");
  t.deepEqual(extractSequenceFromCodes(["0001-TEST-001", "0001-TEST-002"]), ["001", "002"], "Returns all codes");
  t.deepEqual(extractSequenceFromCodes(["0001-TEST-001", "invalid"]), ["001",  undefined], "Returns undefined for codes that don't match");
  t.deepEqual(extractSequenceFromCodes(["0001-TEST-000", "001-test-invalid"]), [undefined,  undefined], "Returns undefined for codes that don't parse");
  t.deepEqual(extractSequenceFromCodes(["0001-TEST-001", "0001-SAMP-002"]), ["001",  "002"], "Returns all results even if they are different sequences (weird case)");

  t.deepEqual(extractSequenceFromCodes([]), [], "returns empty array for empty array");
  t.deepEqual(extractSequenceFromCodes({}), [], "returns empty array for non array");
  t.deepEqual(extractSequenceFromCodes(undefined), [], "returns empty array for undefined");
});

test("next-code: nextCode: returns the next code in the sequence", (t) => {
  t.plan(3);
  const { exitCode, nextLowest, nextHighest } = nextCode('./test/next-code/big-skip/*.md','', false)

  t.equal(exitCode, 0, "Exit code is 0");
  t.equal(nextLowest, "002", "Next lowest is 003");
  t.equal(nextHighest, "023", "Next highest is 023");
})