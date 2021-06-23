# yaml-enforce

<p align="center">
  <a href="https://github.com/semantic-release/semantic-release"
    ><img
      alt="semantic release"
      src="https://flat.badgen.net/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80/semantic%20release/e10079"
    /></a
  >
  <a href="https://github.com/thislooksfun/yaml-enforce/releases/latest"
    ><img
      alt="latest release"
      src="https://flat.badgen.net/github/release/thislooksfun/yaml-enforce"
    /></a
  >
  <a href="https://github.com/thislooksfun/yaml-enforce/releases"
    ><img
      alt="latest stable release"
      src="https://flat.badgen.net/github/release/thislooksfun/yaml-enforce/stable"
    /></a
  >
  <a href="#"
    ><img
      alt="checks status"
      src="https://flat.badgen.net/github/checks/thislooksfun/yaml-enforce"
    /></a
  >
  <a href="https://app.codecov.io/gh/thislooksfun/yaml-enforce"
    ><img
      alt="coverage"
      src="https://flat.badgen.net/codecov/c/github/thislooksfun/yaml-enforce"
    /></a
  >
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/yaml-enforce?activeTab=versions"
    ><img
      alt="npm version"
      src="https://flat.badgen.net/npm/v/yaml-enforce"
    /></a
  >
  <a href="https://github.com/thislooksfun/yaml-enforce/tree/master/types"
    ><img
      alt="npm types"
      src="https://flat.badgen.net/npm/types/yaml-enforce"
    /></a
  >
  <a href="https://www.npmjs.com/package/yaml-enforce"
    ><img
      alt="weekly npm downloads"
      src="https://flat.badgen.net/npm/dw/yaml-enforce"
    /></a
  >
  <a href="https://www.npmjs.com/package/yaml-enforce?activeTab=dependents"
    ><img
      alt="npm dependents"
      src="https://flat.badgen.net/npm/dependents/yaml-enforce"
    /></a
  >
  <a href="https://github.com/thislooksfun/yaml-enforce/blob/master/LICENSE"
    ><img
      alt="license"
      src="https://flat.badgen.net/github/license/thislooksfun/yaml-enforce"
    /></a
  >
</p>

Enforce a structure in your yaml (or json<sup>1</sup>) files.

## Installation

```sh
npm i yaml-enforce
```

Note: Node 14+ is required.

## Usage

<!-- TODO -->

## Contributing

If you want to help out, please read the [CONTRIBUTING.md][c.md].

---

<sup>1</sup>Since yaml 1.2 is a superset of json,
this package also works to validate json files out-of-the-box, though it is
disabled in the cli by default to prevent accidentally trying to validate config
files like package(-lock).json. Use the `--json` or `-j` flag to enable it.

<!-- Links -->

[c.md]: https://github.com/thislooksfun/yaml-enforce/blob/master/CONTRIBUTING.md
