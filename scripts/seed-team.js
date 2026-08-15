#!/usr/bin/env node
/**
 * Seeds the `team` Firestore collection from scripts/team.seed.json.
 *
 * The team page is read-only — there is no in-app write path — so this script
 * (or the Firebase console) is how the roster gets populated. Edit
 * scripts/team.seed.json, then:
 *
 *   pnpm run seed:team             # write to Firestore
 *   pnpm run seed:team -- --dry-run  # validate and print, write nothing
 *
 * Document IDs are slugs of the member's name, so re-running updates the same
 * documents instead of creating duplicates. `createdAt` is preserved on
 * members that already exist.
 *
 * Uses the Admin SDK, which bypasses security rules entirely — the validation
 * below deliberately mirrors the constraints in firebase/firestore.rules so
 * seeded documents are ones the client SDK would also accept.
 */
'use strict'

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const envPath = path.join(root, '.env')
const seedPath = path.join(__dirname, 'team.seed.json')
const dryRun = process.argv.includes('--dry-run')

// firebase-admin is a frontend dependency, so it lives in frontend/node_modules
// rather than at the repo root. Resolve it from there explicitly.
function requireFromFrontend(id) {
  return require(require.resolve(id, { paths: [path.join(root, 'frontend')] }))
}

function fail(message) {
  console.error(`\x1b[31m${message}\x1b[0m`)
  process.exit(1)
}

/** Minimal .env parser — KEY=VALUE lines, # comments, no multiline values. */
function parseEnv(content) {
  const vars = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

/** "Ada Lovelace" → "ada-lovelace" */
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Mirrors the field constraints in firebase/firestore.rules for team/{memberId}. */
function validate(member, index) {
  const where = `team.seed.json[${index}]`
  const str = (field, max, required) => {
    const value = member[field]
    if (typeof value !== 'string') fail(`${where}: "${field}" must be a string`)
    if (required && value.trim().length === 0) fail(`${where}: "${field}" must not be empty`)
    if (value.length > max) fail(`${where}: "${field}" must be ${max} characters or fewer`)
  }

  str('name', 100, true)
  str('role', 100, true)
  str('blurb', 500, false)

  if (member.photoUrl !== null && typeof member.photoUrl !== 'string') {
    fail(`${where}: "photoUrl" must be a string or null`)
  }
  if (!Number.isInteger(member.order)) {
    fail(`${where}: "order" must be an integer`)
  }
}

async function main() {
  if (!fs.existsSync(envPath)) {
    fail(
      'No .env file found at the repo root.\n' +
        'Create it first:  cp .env.example .env  (then fill in your Firebase values)'
    )
  }
  if (!fs.existsSync(seedPath)) {
    fail(`No seed file found at ${path.relative(root, seedPath)}`)
  }

  const env = parseEnv(fs.readFileSync(envPath, 'utf8'))
  const key = env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!key) fail('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not set in .env — see README.md step 2.')
  if (!projectId) fail('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in .env — see README.md step 2.')

  let members
  try {
    members = JSON.parse(fs.readFileSync(seedPath, 'utf8'))
  } catch (error) {
    fail(`Could not parse ${path.relative(root, seedPath)}: ${error.message}`)
  }
  if (!Array.isArray(members)) fail('team.seed.json must contain an array of members.')

  members.forEach(validate)

  const ids = members.map((member) => slugify(member.name))
  ids.forEach((id, index) => {
    if (!id) fail(`team.seed.json[${index}]: "name" must contain at least one letter or digit`)
    if (ids.indexOf(id) !== index) {
      fail(`team.seed.json[${index}]: duplicate member id "${id}" — names must be distinct`)
    }
  })

  if (dryRun) {
    console.log(`Validated ${members.length} member(s). No changes written (--dry-run):`)
    members.forEach((member, i) => console.log(`  ${ids[i]}  ${member.name} — ${member.role}`))
    return
  }

  const { initializeApp, cert } = requireFromFrontend('firebase-admin/app')
  const { getFirestore, Timestamp } = requireFromFrontend('firebase-admin/firestore')

  let credential
  try {
    credential = cert(JSON.parse(Buffer.from(key, 'base64').toString('utf8')))
  } catch (error) {
    fail(`FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not valid base64 JSON: ${error.message}`)
  }

  const db = getFirestore(initializeApp({ credential, projectId }))
  const collection = db.collection('team')
  const now = Timestamp.now()

  // Read first so an existing member keeps its original createdAt.
  const existing = await Promise.all(ids.map((id) => collection.doc(id).get()))

  const batch = db.batch()
  members.forEach((member, i) => {
    const snapshot = existing[i]
    batch.set(collection.doc(ids[i]), {
      name: member.name,
      role: member.role,
      blurb: member.blurb,
      photoUrl: member.photoUrl,
      order: member.order,
      createdAt: snapshot.exists ? snapshot.get('createdAt') : now,
      updatedAt: now,
      deletedAt: null,
      _schemaVersion: 1,
    })
  })
  await batch.commit()

  const created = existing.filter((snapshot) => !snapshot.exists).length
  console.log(
    `\x1b[32mSeeded ${members.length} team member(s) into "${projectId}"\x1b[0m ` +
      `(${created} created, ${members.length - created} updated).`
  )
  console.log('Deploy the rules and index if you have not yet:')
  console.log('  npx firebase-tools deploy --only firestore:rules,firestore:indexes')
}

main().catch((error) => fail(error.stack || String(error)))
