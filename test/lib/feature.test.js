const { isValidFeature } = require('../../src/lib/feature');
const test = require('tape');

test('isValidFeature: Valid feature', (t) => {
    const feature1 = {
        acs: ["Some acceptance criteria"],
        milestone: "Some milestone"
    };
    t.equal(isValidFeature("Feature 1", feature1), true);
    t.end();
});

test('isValidFeature: Invalid feature name', (t) => {
    const feature2 = {
        acs: ["Some acceptance criteria"],
        milestone: "Some milestone"
    };
    t.equal(isValidFeature("", feature2), false);
    t.end();
});

test('isValidFeature: No acceptance criteria', (t) => {
    const feature3 = {
        acs: [],
        milestone: "Some milestone"
    };
    t.equal(isValidFeature("Feature 3", feature3), false);
    t.end();
});

test('isValidFeature: No milestone', (t) => {
    const feature4 = {
        acs: ["Some acceptance criteria"],
        milestone: ""
    };
    t.equal(isValidFeature("Feature 4", feature4), false);
    t.end();
});

test('isValidFeature: Invalid feature name and no milestone', (t) => {
    const feature5 = {
        acs: ["Some acceptance criteria"],
        milestone: ""
    };
    t.equal(isValidFeature("", feature5), false);
    t.end();
});