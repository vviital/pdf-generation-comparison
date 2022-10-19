import * as _ from 'lodash';

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
}
