import * as _ from 'lodash';
import {createInstance, InstanceDTO} from './src/data';
import {PDFMakeEngine} from './src/pdfmake';
import {ChromeEngine} from './src/chrome';
import Metrics from './src/metrics';
import {Sizes} from './src/types';
import {BaseEngine} from './src/base-engine';

const instanceSize: Sizes = (process.env.INSTANCE_SIZE as Sizes) || 'small';
const concurrency: number = +(process.env.INSTANCES_CONCURRENCY || 1);

console.log('Config: ', JSON.stringify({instanceSize, concurrency}));

const instances = _.times(concurrency, () => createInstance(instanceSize));

async function main() {
  const chromeMetrics = new Metrics();
  const pdfmakeMetrics = new Metrics();
  const chromeEngine = new ChromeEngine(chromeMetrics);
  const pdfMakeEngine = new PDFMakeEngine(pdfmakeMetrics);

  await testRunner(instances, pdfMakeEngine);
  await testRunner(instances, chromeEngine);

  console.log('--- chrome stats:', JSON.stringify(chromeMetrics.stats(), null, ' '));
  console.log('--- pdfmake stats:', JSON.stringify(pdfmakeMetrics.stats(), null, ' '));
}

async function testRunner(instances: InstanceDTO[], engine: BaseEngine<InstanceDTO>) {
  console.log('--- instances: ', _.size(instances));

  await engine.init();

  for (let i = 0; i < 10; i++) {
    console.time(`--- iteration: ${i + 1}`);
    await Promise.all(_.map(instances, async (instance) => engine.createPdf(instance)));
    console.timeEnd(`--- iteration: ${i + 1}`);
  }

  await engine.close();
}

main();
