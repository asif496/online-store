// backend/src/pdf/renderPdf.js
'use strict';
const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

async function renderPdf(htmlContent) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

function loadTemplate(name) {
  return fs.readFileSync(path.join(__dirname, 'templates', name), 'utf8');
}

module.exports = { renderPdf, loadTemplate };
