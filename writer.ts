import * as fs from 'fs';
import {createInstance} from './src/data';
import {PDFMakeEngine} from './src/pdfmake';
import {ChromeEngine} from './src/chrome';
import Metrics from './src/metrics';

const instance = createInstance('small');

console.log('--- instance ---', instance);

const chromeMetrics = new Metrics();
const pdfmakeMetrics = new Metrics();

const chromeEngine = new ChromeEngine(chromeMetrics);
const pdfMakeEngine = new PDFMakeEngine(pdfmakeMetrics);

async function main() {
  await chromeEngine.init();
  await pdfMakeEngine.init();

  {
    const pdf = await pdfMakeEngine.createPdf(instance);
    fs.writeFileSync('./pdf-via-pdfmake.pdf', pdf);

    console.log('--- pdfmake stats:', JSON.stringify(pdfmakeMetrics.stats(), null, ' '));
  }

  {
    const pdf = await chromeEngine.createPdf(instance);
    fs.writeFileSync('./pdf-via-chrome.pdf', pdf);

    console.log('--- chrome stats:', JSON.stringify(chromeMetrics.stats(), null, ' '));
  }

  await chromeEngine.close();
  await pdfMakeEngine.close();
}

main();
