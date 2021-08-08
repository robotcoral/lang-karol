<p align="center">
<img src="resources/coral.svg" height="100px" alt="Logo" />
</p>

<p align="center">
<img src="https://img.shields.io/github/license/robotcoral/karol-parser" alt="Package License" />
<a href="https://snyk.io/test/github/robotcoral/karol-parser/"><img src="https://snyk.io/test/github/robotcoral/karol-parser/badge.svg" alt="Vulnerabilities" /></a>
</p>

## Description

CodeMirror 6 language package template

This is an example repository containing a minimal [CodeMirror](https://codemirror.net/6/) language support package. The idea is to clone it, rename it, and edit it to create support for a new language.

Things you'll need to do (see the [language support example](https://codemirror.net/6/examples/lang-package/) for a more detailed tutorial):

- `git grep EXAMPLE` and replace all instances with your language name.

- Rewrite the grammar in `src/syntax.grammar` to cover your language. See the [Lezer system guide](https://lezer.codemirror.net/docs/guide/#writing-a-grammar) for information on this file format.

- Adjust the metadata in `src/index.ts` to work with your new grammar.

- Adjust the grammar tests in `test/cases.txt`.

- Build (`npm run prepare`) and test (`npm test`).

- Rewrite this readme file.

- Optionally add a license.

- Publish. If you want to use a `@codemirror/lang-...` package name, open an [issue](https://github.com/codemirror/codemirror.next/issues) to ask for npm publish rights for that name.

## Setting up your development environment

TODO

## Development Guidelines

Please abide by the following guidelines to keep the repository as clean as possible.
As a general rule we require all commits to be signed.

### Branches

#### Adding new Features and Refactoring

All feature and refactor branches must stem from the `development` branch and have to be merged back into it by pull requests.

The branchnames have to adhere to the following pattern:
`[type]/[name]`

The following types can be used:

- feature: adding new functionality
- refactor: changing code without introducing new features
- bugfix: fixing a bug
- docs: update documentation without changing production code

#### Release Branches

After all the features that will be included in the next release have been merged into master, you can create a new branch named `release/version`.
No new features may be added to this release branch. The only acceptable commits to release branches are:

- small tidying up task
- bumping the version
- fixes

#### Hotfixes

Hotfix branches may be created from master and merged directly back into it. They have to be named `hotfix/issue`

#### Master Branch

The master branch **only** contains tagged commits corresponding to software releases!
To create a new release merge a release or hotfix branch into master and create a new tag (`v1.2.3`).

### Commits

To keep our repository tidy all commits have to adhere to the [Conventional Commit Guidelines](https://www.conventionalcommits.org/en/).
You can find a brief summary below:

- Structure:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- We use the following types:

  - fix: Fixes a bug
  - feat: Adds a new feature
  - refactor: Changes code but doesn't add new features
  - docs: Updates doc files
  - test: Updates tests but doesn't touch production code

- Breaking changes:
  If an update introduces breaking changes add a `!` after the type (and scope) and optionally add the `BREAKING CHANGE` footer.

The commit message should also follow these rules:

1. Separate subject from body with a blank line
2. Limit the subject line to 50 characters
3. Capitalize the subject line
4. Do not end the subject line with a period
5. Use the imperative mood in the subject line
6. Wrap the body at 72 characters
7. Use the body to explain what and why vs. how
