import * as _ from 'lodash';
import {createInstance, InstanceDTO} from './src/data';
import {PDFMakeEngine} from './src/pdfmake';
import {ChromeEngine} from './src/chrome';
import Metrics from './src/metrics';
import {Sizes} from './src/types';
import {BaseEngine} from './src/base-engine';

const instanceSize: Sizes = (process.env.INSTANCE_SIZE as Sizes) || 'small';
const concurrency: number = +(process.env.INSTANCES_CONCURRENCY || 1);
const iterations: number = +(process.env.ITERATIONS || 10);
const maxConcurrentRequests: number = +(process.env.MAX_CONCURRENT_REQUESTS || 100);
const engine: string = process.env.ENGINE === 'chrome' ? 'chrome' : 'pdfmake';

const config = {engine, iterations, instanceSize, concurrency, maxConcurrentRequests, failed: false};

console.log('Config: ', JSON.stringify(config));

async function main() {
  const metrics = new Metrics();
  const generator = engine === 'chrome' ? new ChromeEngine(metrics) : new PDFMakeEngine(metrics);
  await testRunner(generator, metrics);
}

async function testRunner(engine: BaseEngine<InstanceDTO>, metrics: Metrics) {
  console.log('--- instances: ', concurrency);

  await engine.init();

  try {
    for (let i = 0; i < iterations; i++) {
      const instances = _.times(concurrency, () => createInstance(instanceSize));
      console.time(`--- iteration: ${i + 1}`);
      await Promise.all(_.map(instances, async (instance) => engine.createPdf(instance)));
      console.timeEnd(`--- iteration: ${i + 1}`);
    }
  } catch (error) {
    console.error('--- error ---', error);
    config.failed = true;
  }

  await metrics.print(config);
  await engine.close();
}

main();
