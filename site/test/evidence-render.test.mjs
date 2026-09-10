import assert from 'node:assert/strict'
import {cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {after, before, test} from 'node:test'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SITE = path.join(ROOT, 'site')
let scratch
let siteRoot
let output
let fixture

function buildSite() {
  return spawnSync(process.execPath,
    [path.join(SITE, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', siteRoot],
    {cwd: siteRoot, encoding: 'utf8', timeout: 120000})
}

before(async () => {
  scratch = await mkdtemp(path.join(tmpdir(), 'signal-evidence-render-'))
  siteRoot = path.join(scratch, 'site')
  await mkdir(siteRoot)
  for (const entry of ['src', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(path.join(SITE, entry), path.join(siteRoot, entry), {recursive: true})
  }
  await mkdir(path.join(scratch, 'method'))
  await cp(path.join(ROOT, 'method/validate-signals.mjs'),
    path.join(scratch, 'method/validate-signals.mjs'))
  await symlink(path.join(SITE, 'node_modules'), path.join(siteRoot, 'node_modules'), 'junction')
  const published = path.join(siteRoot, 'content/published')
  await mkdir(published, {recursive: true})
  await cp(path.join(SITE, 'content/published/2026-01-01.json'),
    path.join(published, '2026-01-01.json'))
  fixture = JSON.parse(await readFile(
    path.join(SITE, 'test/fixtures/evidence-signal.json'), 'utf8'))
  fixture.supporting_sources[0].quote = '<img src=x onerror=alert(1)>'
  fixture.supporting_sources[0].issue_status.checked = '2026-09-09'
  fixture.supporting_sources[0].issue_status.evidence.quote += ' <script>alert(2)</script>'
  fixture.supporting_sources[0].issue_status.evidence.checked = '2026-09-08'
  fixture.landscape.existing_solutions[0].gap_evidence[0].quote += ' <img src=x onerror=alert(3)>'
  fixture.landscape.existing_solutions[0].gap_evidence[0].checked = '2026-09-07'
  await writeFile(path.join(published, '2026-09-10.json'), JSON.stringify([fixture]))
  await writeFile(path.join(siteRoot, 'src/pages/evidence-compact.astro'), `---
import SignalCard from '../components/SignalCard.astro'
import {getAllSignals} from '../utils/signals'
const [signal] = getAllSignals()
---
<SignalCard signal={signal} compact={true} />
`)
  const build = buildSite()
  assert.equal(build.status, 0, build.error?.message ?? build.stderr + build.stdout)
  output = path.join(siteRoot, 'dist')
})

after(async () => {
  if (scratch) await rm(scratch, {recursive: true, force: true})
})

// Removing either render block must lose its evidence in the built page.
for (const [label, route] of [
  ['full card', '2026-09-10/index.html'],
  ['detail page', 's/evidence-example/index.html'],
]) {
  test(`${label} shows historical context separately from current sources`, async () => {
    const html = await readFile(path.join(output, route), 'utf8')
    assert.match(html, /Supporting context \(1\)/)
    assert.match(html, /sources \(1\)/)
    const context = html.slice(html.indexOf('Supporting context')).split(/<\/details>|<\/section>/)[0]
    assert.match(context, /2025-02-01/)
    assert.match(context, /Current evidence/)
    assert.match(context, /href="https:\/\/example\.com\/current-demand"/)
    assert.match(context, /Issue state: closed/)
    assert.match(context, /Not planned/)
    assert.match(context, /Checked 2026-09-09/)
    assert.match(context, /Checked 2026-09-08/)
    assert.match(context, /href="https:\/\/github\.com\/example\/example\/issues\/123#issuecomment-456"/)
    assert.match(context, /This feature is outside the scope of this example project\./)
  })

  test(`${label} shows verified and unverified gaps with exact supporting citations`, async () => {
    const html = await readFile(path.join(output, route), 'utf8')
    assert.match(html, /Verified gap/)
    assert.match(html, /Unverified gap/)
    assert.match(html, /I could not verify offline support in the documentation checked\./)
    assert.match(html, /href="https:\/\/example\.com\/tool\/pricing#exports"/)
    assert.match(html, /Export is included in the paid plan\./)
    assert.match(html, /Checked 2026-09-07/)
  })

  test(`${label} escapes supporting, closure, and competitor quotes`, async () => {
    const html = await readFile(path.join(output, route), 'utf8')
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
    assert.match(html, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/)
    assert.match(html, /&lt;img src=x onerror=alert\(3\)&gt;/)
    assert.doesNotMatch(html, /<img[^>]*onerror=|<script>alert\(2\)/i)
  })
}

test('compact cards omit the additional context and competitor evidence', async () => {
  const html = await readFile(path.join(output, 'evidence-compact/index.html'), 'utf8')
  assert.match(html, /Evidence example/)
  assert.doesNotMatch(html, /Supporting context|Verified gap|Unverified gap|Current evidence|pricing#exports/)
})

test('legacy records acquire no verification claims or empty supporting sections', async () => {
  const legacy = JSON.parse(await readFile(path.join(SITE, 'content/published/2026-01-01.json'), 'utf8'))
  const dateHtml = await readFile(path.join(output, '2026-01-01/index.html'), 'utf8')
  const detailPath = dateHtml.match(/href="(\/s\/[^\"]+\/)"/)
  assert.ok(detailPath?.[1], 'legacy date page should link to its detail page')
  const detailHtml = await readFile(path.join(output, detailPath[1], 'index.html'), 'utf8')
  for (const html of [dateHtml, detailHtml]) {
    assert.ok(html.includes(legacy[0].title))
    assert.doesNotMatch(html, /Supporting context|Verified gap|Unverified gap|Current evidence/)
  }
})

test('the real site loader rejects executable evidence URLs', async () => {
  const invalid = structuredClone(fixture)
  invalid.landscape.existing_solutions[0].gap_evidence[0].url = 'javascript:alert(4)'
  await writeFile(path.join(siteRoot, 'content/published/2026-09-10.json'), JSON.stringify([invalid]))
  const build = buildSite()
  assert.notEqual(build.status, 0)
  assert.match(build.stderr + build.stdout, /gap_evidence\[0\].*url/)
})
