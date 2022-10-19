import PdfPrinter from 'pdfmake';
import * as _ from 'lodash';
import axios, {AxiosRequestConfig} from 'axios';
import {setTimeout} from 'timers/promises';
import {InstanceDTO} from './data';
import {BaseEngine} from './base-engine';
import {TDocumentDefinitions} from 'pdfmake/interfaces';

const fonts = {
  Courier: {
    normal: 'Courier',
    bold: 'Courier-Bold',
    italics: 'Courier-Oblique',
    bolditalics: 'Courier-BoldOblique',
  },
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
  Times: {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic',
  },
  Symbol: {
    normal: 'Symbol',
  },
  ZapfDingbats: {
    normal: 'ZapfDingbats',
  },
};

const template = (instance: InstanceDTO, images: string[]): TDocumentDefinitions => {
  return {
    defaultStyle: {
      font: 'Helvetica',
    },
    content: [
      {
        text: instance.title,
        style: ['header', 'customHeader'],
      },
      {
        columns: [
          {
            width: '70%',
            text: instance.content,
          },
          {
            width: '30%',
            stack: _.map(images, (image) => {
              return {image, width: 150, height: 150, margin: [10, 10, 10, 10]};
            }),
          },
        ],
      },
    ],
    styles: {
      customHeader: {
        alignment: 'center',
        bold: true,
        margin: [10, 10, 10, 10],
      },
    },
  };
};

const maxConcurrentRequests = process.env.MAX_CONCURRENT_REQUESTS || 100;

export class Requester {
  private counter = 0;

  async request(url: string, config: AxiosRequestConfig): Promise<any> {
    if (this.counter < maxConcurrentRequests) {
      this.counter++;
      return axios.get(url, config).finally(() => this.counter--);
    }

    await setTimeout(_.random(10, 50), '');

    return this.request(url, config);
  }
}

export class PDFMakeEngine extends BaseEngine<InstanceDTO> {
  private printer: PdfPrinter;
  private requester: Requester;

  async init() {
    this.printer = new PdfPrinter(fonts);
    this.requester = new Requester();
  }

  async close() {
    this.printer = null;
  }

  async createPdf(instance: InstanceDTO): Promise<Buffer> {
    instance = _.cloneDeep(instance);

    const downloadMetricsStop = this.metrics.startRecord('image-download');
    const allMetricsStop = this.metrics.startRecord('all');

    const images = await Promise.all(
      _.map(instance.images, async (image) => {
        const response = await this.requester.request(image, {timeout: 2 * 60000, responseType: 'arraybuffer'});
        const raw = Buffer.from(response.data).toString('base64');
        return 'data:image/jpeg;base64,' + raw;
      }),
    );

    downloadMetricsStop();

    const pdfCreationMetricStop = this.metrics.startRecord('pdf-creation');

    const docDefinition = template(instance, images);

    const pdfStream = this.printer.createPdfKitDocument(docDefinition);
    pdfStream.end();

    const chunks: Buffer[] = [];

    for await (const chunk of pdfStream) {
      chunks.push(chunk as Buffer);
    }

    pdfCreationMetricStop();
    allMetricsStop();

    return Buffer.concat(chunks);
  }
}
