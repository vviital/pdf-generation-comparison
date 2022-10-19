import Metrics from './metrics';

export abstract class BaseEngine<T> {
  constructor(protected readonly metrics: Metrics) {}

  abstract init(): Promise<void>;
  abstract createPdf(instance: T): Promise<Buffer>;
  abstract close(): Promise<void>;
}
