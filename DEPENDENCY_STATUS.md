# Dependency status at initial public alpha

Date: 2026-11-05. This is an alpha source release, not a security certification.

`npm audit` reported known advisories in these dependency chains. No forced major-version migration was applied during publication. Re-run `npm audit` against the lockfiles before production deployment.

## server

- `nat-api`: moderate dependency-chain status.
- [form-data uses unsafe random function in form-data for choosing boundary](https://github.com/advisories/GHSA-fjxv-7rqg-78g4)
- [form-data: CRLF injection in form-data via unescaped multipart field names and filenames](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx)
- [qs's arrayLimit bypass in its bracket notation allows DoS via memory exhaustion](https://github.com/advisories/GHSA-6rw7-vpxm-498p)
- [qs: Denial of Service via Attacker Controlled isBuffer](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g)
- [Server-Side Request Forgery in Request](https://github.com/advisories/GHSA-p8p7-x288-28g6)
- [tough-cookie Prototype Pollution vulnerability](https://github.com/advisories/GHSA-72xf-g2v4-qvf3)
- [uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- [xml2js is vulnerable to prototype pollution](https://github.com/advisories/GHSA-776f-qx25-q3cc)

## web

- `vue-i18n`: high dependency-chain status.
- [Vue I18n: `escapeParameter` does not escape named values when the same call also passes a list](https://github.com/advisories/GHSA-8rc2-428q-7ww3)
- [Vue I18n: escapeParameter does not prevent XSS through srcdoc in translation messages](https://github.com/advisories/GHSA-83rm-6c8r-g728)

The legacy `nat-api` chain is used for optional NAT traversal/UPnP; its replacement and regression validation remain pending. Do not interpret passing behavior tests as remediation of these dependency findings.
