# approbation
Scripts for producing a coverage matrix for Vega [specifications](https://github.com/vegaprotocol/specs)

## Specification file names
Each protocol specification receives a sequence number when it is merged in to master. 
This sequence number is a 0-padded integer, strictly 1 greater than the last merged 
specification. The sequence number is the start of the filename, with the end result
that the `./protocol/` folder lists files in the order they were created.

After the sequence number, separated by a `-`, is a 4 letter code. This is arbitrary,
and can be made up at merge time. It's there as a helpful hint as to what spec `0001` is,
rather that having to keep that in mind.

The end result is that every specification (`.md` or `.ipynb`) should be named something like:
```
0024-EXMP-example-specification
```

## Acceptance Criteria codes
Acceptance Criteria codes use the first two parts of the filename (detailed above), and then
another sequence number (this time, 0 padded to 3 characters). These are assigned to each specific
acceptance criteria that should be validated by a test (in any test suite.l)

## The result
The result of the rules above is that we can easily map which acceptance criteria are covered
in which test suite, and what our coverage for the main features identified in specs are. This
is the task that these scripts solve.

## How to name a spec
1. When your pull request is ready to merge, take a look at the most recent sequence number in the
`protocol` folder. Maybe the last spec was `0088-BLAH-example.md`. Your sequence number is `0089`.
2. Now, make yourself a code based on the filename. It should be unique, and it should be memorable,
so for example if the spec is `system_accounts.md`, it *could* be 'SYSA', or 'SYAC' - whatever feels
reasonable.
3. Rename your file to `0088-SYSA-system_accounts.md`
4. Label the acceptance criteria `0088-SYSA-001`, `0088-SYSA-002` and so on.
5. Merge!

## How to reference acceptance criteria in a spec.
These are more *convention* than a rule, but following these steps will ensure that the scripts in 
this folder pick up your references.

1. When you are writing your feature, take a look at the acceptance criteria.
2. If you're addressing one, reference it at the end of the Feature name, for example if you are 
writing a test that covers `0008-SYSA-001`, call the feature `Verify blah (0008-SYSA-001)`
3. If it covers more than one feature, add it inside the same brackets: `Verify blah (0008-SYSA-001, 0008-SYSA-002)`
4. If a feature test intentionally covers something that isn't explicitly an acceptance criteria
you can signal this with `0008-SYSA-additional-tests`


# Available checks
## check-filenames
Checks that filenames in a given path match the above specification

## check-codes
Basic checks for codes in specs

## check-references
Gathers all of the Acceptance Criteria in a given set of specifications, then checks for all of those across a given
set of tests, to produce a coverage number

# Running these checks

## v2.0.0 onwards
_All_ checks take a `--specs` argument, which is a [glob](https://www.npmjs.com/package/glob) specifying the specification files to check.

```bash
npx @vegaprotocol/approbation@latest check-codes --specs='./protocol/*.md'
```

`check-references` also requires a `--tests` glob, specifying the tests to cross-reference with the `--specs`:

```bash
npx @vegaprotocol/approbation@latest check-references --specs='./protocol/*.md' --tests='{./feature/*.feature,./system-tests/**/*.py}'
```

This second example shows how to use globs to specify multiple paths containing tests. For more complex examples, check the 
 [glob](https://www.npmjs.com/package/glob) documentation.

### Defaults
Default paths will be removed in v3.0.0, but exist in v2.0.0 for legacy support. If not specified, for `check-codes` & `check-filenames`:
```
--specs='{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
```

And for `check-references`:
```
--specs='{./non-protocol-specs/**/*.md,./protocol/**/*.md}'
--tests'{./qa-scenarios/**/*.{feature,py}}'
  
```

# Development
- Linting uses [standard](https://www.npmjs.com/package/standard)
- Tests are run pre-push by [Husky](https://www.npmjs.com/package/husky)
- Tags are pushed to npm

# [License](./LICENSE)
The Unlicense
