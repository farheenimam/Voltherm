/**
 * manager — orchestrates the full agent pipeline for a single site.
 *
 * Flow:
 *   1. heatAgent + shadeAgent run in parallel (both only need raw site data)
 *   2. financialAgent runs once heat/shade are available (uses them as context)
 *   3. calculateTSS() combines all three into a deterministic score (lib/tssFormula.js)
 *   4. critiqueAgent reviews everything and writes the final narrative
 *
 * This orchestration logic itself is real; only the individual agent
 * bodies are dummy implementations (see agents/*Agent.js).
 */

import { sliceForAgent } from '../lib/validators.js';
import { calculateTSS } from '../lib/tssFormula.js';
import { runHeatAgent } from './heatAgent.js';
import { runShadeAgent } from './shadeAgent.js';
import { runFinancialAgent } from './financialAgent.js';
import { runCritiqueAgent } from './critiqueAgent.js';

/**
 * @param {object} site - full, validated site payload from the request body
 * @param {(step: string, status: 'running'|'done') => void} [onProgress] - optional callback
 *        fired as each agent starts/finishes, so a route can stream progress
 *        (e.g. via SSE) to the AgentStatusLoader UI.
 * @returns {Promise<object>} the full screening result, ready to persist + return
 */
export async function screenSite(site, onProgress = () => {}) {
  onProgress('heat', 'running');
  onProgress('shade', 'running');

  const [heatResult, shadeResult] = await Promise.all([
    runHeatAgent(sliceForAgent('heat', site)),
    runShadeAgent(sliceForAgent('shade', site)),
  ]);

  onProgress('heat', 'done');
  onProgress('shade', 'done');

  onProgress('financial', 'running');
  const financialResult = await runFinancialAgent(sliceForAgent('financial', site), { heatResult, shadeResult });
  onProgress('financial', 'done');

  const tss = calculateTSS(heatResult, shadeResult, financialResult);

  onProgress('critique', 'running');
  const critiqueResult = await runCritiqueAgent({ heatResult, shadeResult, financialResult, tss });
  onProgress('critique', 'done');

  return {
    tss,
    heatResult,
    shadeResult,
    financialResult,
    critiqueResult,
    screenedAt: new Date().toISOString(),
  };
}

export default { screenSite };
