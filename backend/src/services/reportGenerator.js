/**
 * reportGenerator — builds the downloadable PDF site report.
 *
 * DUMMY IMPLEMENTATION. Returns a small in-memory Buffer standing in for a
 * PDF instead of actually rendering one.
 *
 * TODO(report): wire up a real PDF library (pdf-lib, pdfkit, or puppeteer
 * rendering an HTML template) and pull the underlying data from
 * `fortyguardClient.getHeatIntelligenceReport()` plus the agent results
 * stored on the site record.
 */

import { getHeatIntelligenceReport } from './fortyguardClient.js';

/**
 * @param {object} site - a full site record (see db/sites.js)
 * @returns {Promise<{ filename: string, mimeType: string, buffer: Buffer }>}
 */
export async function generateSiteReportPdf(site) {
  // TODO(report): replace with real report data + real PDF rendering.
  const heatIntel = await getHeatIntelligenceReport({
    siteId: site.id,
    latitude: site.latitude,
    longitude: site.longitude,
  });

  const dummyContents = [
    `Voltherm Site Report (DUMMY PDF PLACEHOLDER)`,
    `Site: ${site.siteName}`,
    `Address: ${site.address}`,
    `TSS Score: ${site.tss?.score ?? 'N/A'} (${site.tss?.band?.label ?? 'N/A'})`,
    `Generated: ${heatIntel.generatedAt}`,
    `Sections included: ${heatIntel.sections.join(', ')}`,
  ].join('\n');

  return {
    filename: `voltherm-report-${site.id}.pdf`,
    mimeType: 'application/pdf',
    buffer: Buffer.from(dummyContents, 'utf-8'),
  };
}

export default { generateSiteReportPdf };
