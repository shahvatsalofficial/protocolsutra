import { createHmac, timingSafeEqual } from 'node:crypto';
import { digest, canonical, isObject, sanitize } from './utils.mjs';

/**
 * Interoperability Proof Capsule: redacted evidence + sha256 content digest
 * (+ optional HMAC-SHA256 when a shared key is supplied). The digest proves the
 * file was not altered since export; it does NOT prove the evidence was truthfully
 * produced, and HMAC is symmetric (not a public-key signature).
 */
export const CAPSULE_VERSION = '1';
export function exportCapsule(report, { source = 'unspecified', key } = {}) {
  if (!isObject(report)) throw new Error('Report must be an object');
  const evidence = sanitize(report);
  const body = { capsuleVersion: CAPSULE_VERSION, kind: 'protocolsutra-capsule', tool: 'protocolsutra', source, redacted: true, executedLive: false, evidence };
  const contentDigest = digest(body);
  const capsule = { ...body, integrity: { algorithm: 'sha256', contentDigest } };
  if (key) { if (String(key).length < 16) throw new Error('Signing key must be at least 16 characters'); capsule.integrity.hmacSha256 = createHmac('sha256', key).update(contentDigest).digest('hex'); }
  return capsule;
}
export function verifyCapsule(capsule, { key } = {}) {
  const problems = [];
  if (!isObject(capsule) || capsule.kind !== 'protocolsutra-capsule' || !isObject(capsule.integrity)) return { valid: false, gate: 'NO_GO', problems: ['NOT_A_CAPSULE'], signature: 'none' };
  const { integrity, ...body } = capsule;
  const expected = digest(body);
  if (integrity.contentDigest !== expected) problems.push('DIGEST_MISMATCH');
  let signature = integrity.hmacSha256 ? 'present-unchecked' : 'none';
  if (integrity.hmacSha256) {
    if (!key) problems.push('SIGNATURE_KEY_NOT_PROVIDED');
    else {
      const want = createHmac('sha256', key).update(expected).digest();
      const got = Buffer.from(String(integrity.hmacSha256), 'hex');
      const ok = got.length === want.length && timingSafeEqual(got, want);
      signature = ok ? 'verified' : 'invalid';
      if (!ok) problems.push('SIGNATURE_INVALID');
    }
  }
  if (JSON.stringify(sanitize(body.evidence)) !== JSON.stringify(body.evidence)) problems.push('UNREDACTED_SECRET_PATTERN');
  return { valid: problems.length === 0, gate: problems.length ? 'NO_GO' : 'PASS', problems, signature, contentDigest: expected, notice: 'Integrity check only: proves the file is unchanged since export, not that the evidence was honestly produced.' };
}
export { canonical };
