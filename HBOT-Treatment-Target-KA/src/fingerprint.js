'use strict';

const crypto = require('node:crypto');

// Deterministic canonical-JSON stringification (sorted object keys, stable
// array order). This is a pragmatic stand-in for the RFC 8785 JSON
// Canonicalization Scheme referenced by CKS Version 1.0 Section 9.6: it is
// deterministic and collision-resistant for the purpose of this
// implementation's internal integrity checks and provenance fingerprints.
function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value === undefined ? null : value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(',')}}`;
}

function sha256Hex(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

// Fingerprint profile identifier per Section 9.6.
const FINGERPRINT_PROFILE_IRI =
  'https://kgrid.org/cks/hbot-treatment-target-ka/fingerprint-profile/sha256-jcs-1.0';

function fingerprintJson(value, mediaType = 'application/json') {
  const canonical = canonicalize(value);
  const domainSeparated = Buffer.concat([
    Buffer.from('KA-FP-v1', 'utf8'),
    Buffer.from([0]),
    Buffer.from(mediaType.toLowerCase(), 'utf8'),
    Buffer.from([0]),
    Buffer.from(canonical, 'utf8')
  ]);
  return `sha256:${sha256Hex(domainSeparated)}`;
}

function fingerprintText(text) {
  return fingerprintJson(text, 'text/plain');
}

module.exports = {
  FINGERPRINT_PROFILE_IRI,
  canonicalize,
  fingerprintJson,
  fingerprintText
};
