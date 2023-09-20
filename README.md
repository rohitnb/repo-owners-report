# Repo Owners Report

## Inputs

### `org-token`

A GitHub personal access token with `org:admin` scopes. Add this to the repository as a secret named `ORG_TOKEN`

### `org-name`

GitHub Org Name. The token generated in Step 1 must have org admin rights over this org. 

## Outputs

Generates a CSV file with the name `{org-name}-repo-owners-report.csv`

## Example Usage

Quickstart: Use this [template repository](https://github.com/rohitnb/repo-owners-caller) & follow the instructions to get the report

```yml
name: Repo Owners report

on: 
  workflow_dispatch:
    inputs:
      org-name:
        description: 'Org Name'
        required: true

jobs:
  call-repo-owners:
    runs-on: ubuntu-latest
    name: Repo Owners
    steps:
      - id: run-script
        uses: rohitnb/repo-owners-report@main
        with:
          org-token: ${{ secrets.ORG_TOKEN }}
          org-name: ${{ github.event.inputs.org-name }}
      - uses: actions/upload-artifact@v3.1.3
        with:
          name: repo-owners-report
          path: ${{ github.event.inputs.org-name }}-repo-owners-report.csv

```

## Local Testing

Set the environment variables `ORG_TOKEN` and `ORG_NAME`

```sh
export ORG_TOKEN=ghp_************
export ORG_NAME=org-a
```

Run the script
```sh
node src/index.js
```

`{org-name}-repo-owners-report.csv` will be generated locally
