/**
 * scripts/validate-data.ts
 *
 * S2 Data Agent 交付校验 — 验证 6 个 JSON 数据文件的完整性和 DSP 钩子。
 *
 * 用法: npx tsx scripts/validate-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data');

const CHECKS: { file: string; label: string; checks: ((data: any) => string | null)[] }[] = [
  {
    file: 'resumes.json',
    label: 'Resumes',
    checks: [
      (d) => !d._meta ? '缺少 _meta' : null,
      (d) => !d._meta?.dsp_hooks ? '_meta 中缺少 dsp_hooks' : null,
      (d) => !Array.isArray(d.data) ? 'data 不是数组' : null,
      (d) => d.data?.length < 60 ? `仅 ${d.data?.length} 条简历，需 ≥ 60` : null,
      (d) => {
        if (!d.data) return null;
        const ids = new Set(d.data.map((r: any) => r.id));
        if (ids.size !== d.data.length) return '存在重复 ID';
        return null;
      },
      (d) => {
        if (!d.data) return null;
        const zhangsan = d.data.find((r: any) => r.id === 'res_007');
        if (!zhangsan) return '缺少 res_007 (张三)';
        if (zhangsan.name !== '张三') return `res_007 应为"张三"`;
        if (zhangsan.lastActive !== '2025-11-20') return 'res_007 lastActive 异常 (DSP-3)';
        if (!zhangsan.notes?.some((n: string) => n.includes('OPPO'))) return 'res_007 notes 缺 OPPO 线索 (DSP-3)';
        if (!zhangsan.interviewHistory || zhangsan.interviewHistory.length < 2) return 'res_007 缺面试记录 (DSP-4)';
        return null;
      },
      (d) => {
        if (!d.data) return null;
        const ivCount = d.data.filter((r: any) => r.interviewHistory && r.interviewHistory.length > 0).length;
        if (ivCount < 5) return `仅 ${ivCount} 人有面试记录，需 ≥ 5`;
        return null;
      },
    ],
  },
  {
    file: 'jobs.json',
    label: 'Jobs',
    checks: [
      (d) => !d._meta ? '缺少 _meta' : null,
      (d) => !d._meta?.dsp_hooks ? '_meta 中缺少 dsp_hooks' : null,
      (d) => !Array.isArray(d.data) ? 'data 不是数组' : null,
      (d) => d.data?.length < 10 ? `仅 ${d.data?.length} 岗位` : null,
      (d) => {
        if (!d.data) return null;
        const titles = d.data.map((j: any) => j.title).join(' ');
        for (const kw of ['BSP', '嵌入式', '固件', '底层驱动']) {
          if (titles.includes(kw)) return `DSP-1 失效: 发现 "${kw}"`;
        }
        return null;
      },
    ],
  },
  {
    file: 'pipeline.json',
    label: 'Pipeline',
    checks: [
      (d) => !d._meta ? '缺少 _meta' : null,
      (d) => !d._meta?.dsp_hooks ? '_meta 中缺少 dsp_hooks' : null,
      (d) => (!d.jobs || Object.keys(d.jobs).length < 10) ? `仅 ${Object.keys(d.jobs||{}).length} 岗位` : null,
      (d) => {
        const job = d.jobs?.job_001;
        if (!job?.weekly_history || job.weekly_history.length < 4) return 'job_001 缺 weekly_history (DSP-5)';
        const rates = job.weekly_history.map((w:any) => w.screening_pass_rate);
        if (rates[0] < 0.25 || rates[rates.length-1] > 0.21) return `DSP-5 趋势异常: ${rates}`;
        return null;
      },
    ],
  },
  {
    file: 'market.json',
    label: 'Market',
    checks: [
      (d) => !d._meta ? '缺少 _meta' : null,
      (d) => {
        const keys = Object.keys(d).filter(k => k !== '_meta');
        if (keys.length < 15) return `仅 ${keys.length} 方向`;
        return null;
      },
      (d) => !d.bsp_firmware_engineer ? 'DSP-1 失效: 缺 bsp_firmware_engineer' : null,
      (d) => !d.embedded_iot ? 'DSP-1 失效: 缺 embedded_iot' : null,
    ],
  },
  {
    file: 'salary.json',
    label: 'Salary',
    checks: [
      (d) => !d._meta ? '缺少 _meta' : null,
      (d) => {
        const keys = Object.keys(d).filter(k => k !== '_meta');
        if (keys.length < 12) return `仅 ${keys.length} 岗位`;
        return null;
      },
      (d) => !d.bsp_engineer ? 'DSP-1 失效: 缺 bsp_engineer' : null,
    ],
  },
  {
    file: 'referrals.json',
    label: 'Referrals',
    checks: [
      (d) => !d._meta ? '缺少 _meta' : null,
      (d) => !Array.isArray(d.referrals) ? 'referrals 不是数组' : null,
      (d) => d.referrals?.length < 20 ? `仅 ${d.referrals?.length} 条内推` : null,
      (d) => {
        if (!d.referrals) return null;
        const zhangsan = d.referrals.find((r:any) => r.candidate_id === 'res_007');
        if (!zhangsan) return '缺张三(res_007)内推 (DSP-3)';
        if (!zhangsan.recommendation?.includes('OPPO')) return '张三内推语缺 OPPO 线索';
        return null;
      },
    ],
  },
];

let errors = 0;
let passes = 0;

for (const { file, label, checks } of CHECKS) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${label} (${file}): 文件不存在`);
    errors++;
    continue;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  let data: any;
  try { data = JSON.parse(raw); }
  catch (e) { console.log(`❌ ${label}: JSON 解析失败`); errors++; continue; }

  let fileErrors = 0;
  for (const check of checks) {
    const err = check(data);
    if (err) { console.log(`❌ ${label}: ${err}`); fileErrors++; }
  }
  if (fileErrors === 0) { console.log(`✅ ${label}: ${checks.length} 项通过`); passes++; }
  else { errors += fileErrors; }
}

const readmePath = path.join(DATA_DIR, 'README.md');
if (fs.existsSync(readmePath)) { console.log('✅ README.md: 存在'); passes++; }
else { console.log('❌ README.md: 不存在'); errors++; }

console.log(`\n${'='.repeat(40)}`);
console.log(`通过: ${passes}  失败: ${errors}`);
if (errors === 0) console.log('🎉 全部校验通过！');
else { console.log('⚠️ 存在失败项'); process.exit(1); }
