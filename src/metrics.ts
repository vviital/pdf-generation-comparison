import * as _ from 'lodash';
import fs from 'node:fs/promises';
import path from 'path';

export default class Metrics {
  private readonly resultsMs: {label: string; value: number}[];

  constructor() {
    this.resultsMs = [];
  }

  startRecord(label: string = 'default'): () => void {
    const start = Date.now();
    return () => {
      this.resultsMs.push({label, value: Date.now() - start});
    };
  }

  stats(): Record<string, {min: number; max: number; avg: number}> {
    const groups = _.groupBy(this.resultsMs, 'label');

    return _.transform(
      groups,
      (acc, value, key) => {
        const values = _.map(value, 'value');
        acc[key] = {
          min: _.min(values),
          max: _.max(values),
          avg: _.round(_.sum(values) / _.size(values), 2),
        };
      },
      {},
    );
  }

  async print(meta: Record<string, any>) {
    const stats = this.stats();

    const filepath = path.resolve(__dirname, '../../results/stats.json');
    const file = await fs.readFile(filepath).catch(async (error) => {
      if (error.code === 'ENOENT') {
        await fs.writeFile(filepath, JSON.stringify([]));
        return fs.readFile(filepath);
      }
    });

    const result = JSON.parse(file.toString());
    await fs.writeFile(filepath, JSON.stringify([...result, {...meta, ...stats}], null, ' '));
  }
}
