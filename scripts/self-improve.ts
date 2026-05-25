#!/usr/bin/env npx tsx
/**
 * Self-Improve CLI — 读取对话历史，运行 collector → classifier → optimizer，
 * 输出可读的报告到终端。
 *
 * 用法:
 *   npx tsx scripts/self-improve.ts                    # 读取默认 chat-history.jsonl
 *   npx tsx scripts/self-improve.ts --file ./custom.jsonl
 */

import * as fs from 'node:fs';
import { collectFromJSONL } from '../src/self_improve/collector.js';
import { classifySamplesSync } from '../src/self_improve/classifier.js';
import { optimizeSync } from '../src/self_improve/optimizer.js';

// ══════════════════════════════════════════
// 参数解析
// ══════════════════════════════════════════

const args = process.argv.slice(2);
let filePath = './chat-history.jsonl';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    filePath = args[i + 1];
    i++;
  }
}

// ══════════════════════════════════════════
// 主流程
// ══════════════════════════════════════════

function main() {
  console.log('🔬 HireAgent Self-Improve 分析器\n');
  console.log(`   数据源: ${filePath}\n`);

  // 读取
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    console.error(`❌ 无法读取文件: ${filePath}`);
    console.error('   用法: npx tsx scripts/self-improve.ts [--file path.jsonl]');
    process.exit(1);
  }

  const lines = raw.split('\n').filter((l) => l.trim());
  if (lines.length === 0) {
    console.log('⚠️  文件为空，无数据可分析。');
    process.exit(0);
  }

  console.log(`   共 ${lines.length} 行 JSONL 记录\n`);

  // Collector
  const samples = collectFromJSONL(lines);
  console.log(`📋 Collector: 提取 ${samples.length} 个会话样本`);

  if (samples.length === 0) {
    console.log('   无有效样本（可能格式不匹配）。');
    process.exit(0);
  }

  const totalTurns = samples.reduce((sum, s) => sum + s.turns.length, 0);
  console.log(`   ${totalTurns} 个对话轮次`);

  // Classifier
  const classified = classifySamplesSync(samples);
  const posCount = classified.filter((c) => c.label === 'positive').length;
  const negCount = classified.filter((c) => c.label === 'negative').length;
  const neuCount = classified.filter((c) => c.label === 'neutral').length;

  console.log(`\n🏷️  Classifier: 分类结果`);
  console.log(`   ✅ positive: ${posCount}`);
  console.log(`   ❌ negative: ${negCount}`);
  console.log(`   ⚪ neutral:  ${neuCount}`);

  // 细节: negative 样本
  if (negCount > 0) {
    console.log(`\n   负样本详情:`);
    for (const c of classified.filter((c) => c.label === 'negative')) {
      for (const t of c.turns.filter((t) => t.label === 'negative')) {
        console.log(`   · [${t.trigger}] ${t.user.slice(0, 60)}...`);
      }
    }
  }

  // Optimizer
  const report = optimizeSync(classified);

  console.log(`\n🔧 Optimizer: 分析报告`);
  console.log(`   负样本率: ${(report.negativeRate * 100).toFixed(1)}% (${report.negativeCount}/${totalTurns})`);

  if (report.clusters.length > 0) {
    console.log(`\n   聚类:`);
    for (const c of report.clusters) {
      console.log(`   - ${c.trigger}: ${c.count} 次`);
      if (c.examples.length > 0) {
        console.log(`     e.g. "${c.examples[0]}"`);
      }
    }
  }

  if (report.suggestions.length > 0) {
    console.log(`\n   Prompt 修改建议 (${report.suggestions.length} 条):`);
    for (const s of report.suggestions) {
      const prio = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${prio} [${s.section}] → ${s.affected_dsp}`);
      console.log(`      当前: ${s.current_behavior}`);
      console.log(`      期望: ${s.desired_behavior}`);
      console.log(`      建议: ${s.suggested_change.slice(0, 120)}...`);
      console.log();
    }
  } else {
    console.log(`\n   ✅ 未检测到需要修改的 prompt 问题。`);
  }

  console.log(`══════════════════════════════`);
  console.log(`  分析完成。请 review 建议后手动合入 prompt。`);
}

main();
