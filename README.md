# approbation

Scripts for producing a coverage matrix for Vega [specifications](https://github.com/vegaprotocol/specs)

```bash
# Use node
npx @vegaprotocol/approbation

# Or run the docker image
docker run ghcr.io/vegaprotocol/approbation:latest
```

# Available commands

All of the globs below are relatively simple - check out [globs primer](https://github.com/isaacs/node-glob#glob-primer) for how to get *more* specific (i.e. look for tests that reference only one specification) or less specific (all subfolders).

## check-codes
> Looks for possible errors in the coding of acceptance criteria

**Arguments**
| **Parameter**   | **Type** | **Description**                      | **Example**          |
|-----------------|----------|--------------------------------------|----------------------|
| `--specs`         | glob     | specs to pull AC codes from          | `{specs/**/*.md}`    |
| `--ignore`        | glob     | glob of files not to check for codes | `specs/0001-spec.md` |
| `--show-branches` | boolean  | Show git branches for subfolders of the current folder | -  |

### check-codes example
```bash
# Use node
npx @vegaprotocol/approbation check-filenames --specs="./specs/protocol/**/*.{md,ipynb}" --show-branches

# Or run the docker image
docker run -v "$(pwd):/run" ghcr.io/vegaprotocol/approbation:latest check-codes --specs="/run/specs/protocol/**/*.{md,ipynb}" --show-branches
```

## check-filenames
> Check that spec filenames are valid

**Arguments**
| **Parameter**   | **Type** | **Description**                      | **Example**          |
|-----------------|----------|--------------------------------------|----------------------|
| `--specs`         | glob     | specs to pull AC codes from          | `{specs/**/*.md}`    |
| `--ignore`        | glob     | glob of files not to check for codes | `specs/0001-spec.md` |
| `--show-branches` | boolean  | Show git branches for subfolders of the current folder | -  |

### check-filenames example
```bash
# Use node
npx @vegaprotocol/approbation check-filenames codes --specs="./specs/protocol/**/*.{md,ipynb}" --tests="./MultisigControl/test/*.js" --ignore="./specs/protocol/{0001-*,0002-*,0004-*}" --show-branches

# Or run the docker image
docker run -v "$(pwd):/run" ghcr.io/vegaprotocol/approbation:latest check-filenames codes --specs="/run/specs/protocol/**/*.{md,ipynb}" --tests="/run/MultisigControl/test/*.js" --ignore="/run/specs/protocol/{0001-*,0002-*,0004-
```
## check-features
> Validates a feature file

**Arguments**
| **Parameter**   | **Type** | **Description**                      | **Example**          |
|-----------------|----------|--------------------------------------|----------------------|
| `--specs`         | glob     | specs to pull AC codes from          | `{specs/**/*.md}`    |
| `--ignore`        | glob     | glob of files not to check for codes | `specs/0001-spec.md` |
| `--features`        | string   | JSON file that contains features mappings for specs                         | `specs/features.json`     |
| `--verbose`         | boolean  | Also list all acs not in a feature                                                                  | -                         |

### check-features example
```bash
# Use node
npx @vegaprotocol/approbation check-features
--specs="{./specs/protocol/**/*.{md,ipynb},./specs/non-protocol-specs/**/*.{md,ipynb}}"
--ignore="{./spec-internal/protocol/0060*,./specs/non-protocol-specs/{0001-NP*,0002-NP*,0004-NP*,0006-NP*,0007-NP*,0008-NP*,0010-NP*}}"
--features="specs/protocol/features.json"

# Or run the docker image
docker run -v "$(pwd):/run" ghcr.io/vegaprotocol/approbation:latest check-features --specs="/run/specs/protocol/**/*.{md,ipynb}"
--ignore="{./spec-internal/protocol/0060*,./specs/non-protocol-specs/{0001-NP*,0002-NP*,0004-NP*,0006-NP*,0007-NP*,0008-NP*,0010-NP*}}"
--features="specs/protocol/features.json"
```

## check-references
> Coverage statistics for acceptance criteria

**Arguments**
| **Parameter**       | **Type** | **Description**                                                             | **Example**               |
| ------------------- | -------- | --------------------------------------------------------------------------- | ------------------------- |
| `--tests`           | glob     | tests to check for AC codes                                                 | `tests/**/*.{py,feature}` |
| `--specs`           | glob     | specs to pull AC codes from                                                 | `{specs/**/*.md}`         |
| `--ignore`          | glob     | glob of files not to check for codes                                        | `specs/0001-spec.md`      |
| `--categories`      | string   | JSON file that contains category mappings for specs                         | `specs/categories.json`   |
| `--features`        | string   | JSON file that contains features mappings for specs                         | `specs/features.json`     |
| `--show-branches`   | boolean  | Show git branches for subfolders of the current folder                      | -                         |
| `--show-mystery`    | boolean  | display criteria in tests that are not in any specs matched by `--specs`    | -                         |
| `--show-files`      | boolean  | display basic stats per file                                                | -                         |
| `--show-file-stats` | boolean  | display detailed stats per file                                             | -                         |
| `--output-csv`      | boolean  | Outputs a CSV file to summarise the console output                          | -                         |
| `--output-jenkins`  | boolean  | Outputs a text file to summarise the console output, to sendover to jenkins | -                         |
| `--output`          | string   | A path to write the CSV or Jenkins output to                                | `./results`               |
| `--verbose`         | boolean  | MORE output                                                                 | -                         |


### check-references example
```bash
# Use node
npx github:vegaprotocol/approbation@latest check-references --specs="./specs/protocol/**/*.{md,ipynb}" --tests="./MultisigControl/test/*.js" --ignore="./specs/protocol/{0001-*}" --categories="specs/protocol/categories.json" --show-branches --show-mystery

# Or run the docker image
docker run -v "$(pwd):/run" ghcr.io/vegaprotocol/approbation:latest check-references --specs="/run/specs/protocol/**/*.{md,ipynb}" --tests="/run/MultisigControl/test/*.js" --ignore="/run/specs/protocol/{0001-*}" --categories="/run/specs/protocol/categories.json" --show-branches --show-mystery --output-csv --output="/run/results/"
```

## next-filename
> Suggests what file sequence number to use next, given a list of spec files

**Arguments**
| **Parameter**   | **Type** | **Description**                      | **Example**          |
|-----------------|----------|--------------------------------------|----------------------|
| `--specs`         | glob     | specs to pull AC codes from          | `{specs/**/*.md}`    |
| `--ignore`        | glob     | glob of files not to include | `specs/0001-spec.md` |
| `--verbose` | boolean  | Display extra output | -  |

In the case of three specs, ['001...', '002...', '003...'] this would suggest '004'. However if '002' didn't exist, it would indicate that '002' is available, as well as '004'.
### next-filename example
```bash
# Use node
npx @vegaprotocol/approbation next-filename --specs="./specs/protocol/**/*.{md,ipynb}"

# Or run the docker image
docker run -v "$(pwd):/run" ghcr.io/vegaprotocol/approbation:latest next-filename --specs="/run/specs/protocol/**/*.{md,ipynb}"
```

## next-code
> Suggests what AC code to use next given a spec file

**Arguments**
| **Parameter**   | **Type** | **Description**                      | **Example**          |
|-----------------|----------|--------------------------------------|----------------------|
| `--specs`         | glob     | spec to pull AC codes from. Should only match one file.          | `{specs/**/0001-SPEC-spec.md}`    |
| `--ignore`        | glob     | glob of files not to include | `specs/0001-spec.md` |
| `--verbose` | boolean  | Display extra output | -  |

Like `next-filename`, `next-code` will suggest the lowest available code in the sequence (e.g. if there is `0001-SPEC-001` and `0001-SPEC-003`), it will suggest both `0001-SPEC-002` and `000-SPEC-004`. If using the lowest available code, ensure it isn't already referenced by any tests (i.e. isn't listed as a 'Mystery Criteria' by `check-references`).

### next-code example
```bash
# Use node
npx @vegaprotocol/approbation next-filename --specs="./specs/protocol/**/*.{md,ipynb}"

# Or run the docker image
docker run -v "$(pwd):/run" ghcr.io/vegaprotocol/approbation:latest next-filename --specs="/run/specs/protocol/**/*.{md,ipynb}"
```


# Background
Each [protocol specification](https://github.com/vegaprotocol/specs) receives a sequence number when it is merged in to master.
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

# Development
Run `npm run setup` to configure your environment:

- Tests should be run pre-push
- Package is published to `npm` on tag

# Use in CI
```shell
# Use the pre-packaged docker version
docker run ghcr.io/vegaprotocol/approbation:latest
```

# [License](./LICENSE)
The Unlicense

<p align="right">
 <img src="https://user-images.githubusercontent.com/6678/159024710-42ae880f-b994-44af-b91d-b3fca3f49685.png" width="80" height="80" />
</p>
