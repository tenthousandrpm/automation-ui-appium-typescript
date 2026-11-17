// Builds the GitHub Pages index for published Allure reports.
//
// Usage: node scripts/build-report-index.mjs <site-dir> [keep=10]
//
// <site-dir> is a checkout of the gh-pages branch. Each CI run publishes its report to
// <site-dir>/reports/<suite>-<run_number>/ with a meta.json written by publish-report.yml.
// This script deletes all but the newest <keep> reports (screenshots would otherwise grow
// the branch forever) and writes <site-dir>/index.html listing the ones left.

import fs from 'node:fs';
import path from 'node:path';

const [siteDir, keepArg = '10'] = process.argv.slice(2);
if (!siteDir) {
    console.error('Usage: node scripts/build-report-index.mjs <site-dir> [keep]');
    process.exit(2);
}
const keep = Number.parseInt(keepArg, 10);
const reportsDir = path.join(siteDir, 'reports');

const reports = (fs.existsSync(reportsDir) ? fs.readdirSync(reportsDir) : [])
    .map(dir => {
        const metaPath = path.join(reportsDir, dir, 'meta.json');
        if (!fs.existsSync(metaPath)) return null;
        return { dir, ...JSON.parse(fs.readFileSync(metaPath, 'utf-8')) };
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));

for (const old of reports.slice(keep)) {
    fs.rmSync(path.join(reportsDir, old.dir), { recursive: true, force: true });
    console.log(`Pruned reports/${old.dir}`);
}
const kept = reports.slice(0, keep);

const escape = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const statusLabel = { success: 'Passed', failure: 'Failed', cancelled: 'Cancelled' };

const rows = kept.map(r => `
      <tr>
        <td><a href="reports/${escape(r.dir)}/">${escape(r.suite)} #${escape(r.runNumber)}</a></td>
        <td><span class="status ${escape(r.result)}">${escape(statusLabel[r.result] ?? r.result)}</span></td>
        <td><code>${escape(r.branch)}</code></td>
        <td><a href="${escape(r.runUrl)}"><code>${escape(r.sha.slice(0, 7))}</code></a></td>
        <td><time datetime="${escape(r.date)}">${escape(r.date.replace('T', ' ').slice(0, 16))} UTC</time></td>
      </tr>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ChefPlanner Test Reports</title>
  <style>
    :root { --bg: #fff; --fg: #1f2328; --muted: #59636e; --line: #d1d9e0; --pass: #1a7f37; --fail: #d1242f; --link: #0969da; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0d1117; --fg: #e6edf3; --muted: #9198a1; --line: #3d444d; --pass: #3fb950; --fail: #f85149; --link: #4493f8; }
    }
    body { margin: 0; padding: 32px 16px; background: var(--bg); color: var(--fg);
           font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    main { max-width: 880px; margin: 0 auto; }
    h1 { font-size: 24px; margin: 0 0 4px; }
    p { color: var(--muted); margin: 0 0 24px; }
    a { color: var(--link); }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
    th { color: var(--muted); font-weight: 600; font-size: 13px; }
    .status { font-weight: 600; }
    .status.success { color: var(--pass); }
    .status.failure { color: var(--fail); }
    .status.cancelled { color: var(--muted); }
  </style>
</head>
<body>
  <main>
    <h1>ChefPlanner Test Reports</h1>
    <p>Allure reports from the last ${keep} CI runs of
      <a href="https://github.com/tenthousandrpm/automation-ui-appium-typescript">automation-ui-appium-typescript</a>.</p>
    ${kept.length === 0 ? '<p>No reports published yet.</p>' : `<div class="table-wrap">
    <table>
      <thead><tr><th>Run</th><th>Result</th><th>Branch</th><th>Commit</th><th>Date</th></tr></thead>
      <tbody>${rows}
      </tbody>
    </table>
    </div>`}
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(siteDir, 'index.html'), html);
console.log(`Wrote index.html with ${kept.length} report(s)`);
