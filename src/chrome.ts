import puppeteer from 'puppeteer';
import * as _ from 'lodash';
import {InstanceDTO} from './data';
import {BaseEngine} from './base-engine';
import {setTimeout} from 'timers/promises';

const template = (instance: InstanceDTO): string => {
  const images = _.map(instance.images, (image) => {
    return `<div><img src="${image}" style="width: 200px; height: 200px; margin: 20px"></div>`;
  });
  const content = _.map(instance.content, (item) => {
    return `<div>${item}</div>`;
  });

  return `<html>
    <body style="margin: 30px; font-family: Helvetica; sans-serif">
       <div style="width: 100%">
         <h3 style="text-align: center;">${instance.title}</h3>
       </div>
       <div style="display: flex; flex-direction: row">
         <div style="width: 70%">${content}</div>
         <div style="width: 30%">${images}</div>
       </div>
    </body>
  </html>`;
};

export class ChromeEngine extends BaseEngine<InstanceDTO> {
  private browser: puppeteer.Browser;
  private freePages: puppeteer.Page[];

  async init() {
    if (this.browser) {
      return;
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-extensions',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
      ],
    });
    this.freePages = await Promise.all(_.times(50, () => this.createPage()));
  }

  async close() {
    await this.browser.close();
  }

  async createPdf(instance: InstanceDTO): Promise<Buffer> {
    instance = _.cloneDeep(instance);

    const pdfCreationMetricStop = this.metrics.startRecord('pdf-creation');

    const page = await this.acquirePage();
    const html = template(instance);

    await page.setContent(html, {waitUntil: ['networkidle0']});

    const dataBuffer = await page.pdf({format: 'a4'});

    await this.releasePage(page);

    pdfCreationMetricStop();

    return dataBuffer;
  }

  private async createPage(): Promise<puppeteer.Page> {
    const page = await this.browser.newPage();
    page.once('error', async (error) => {
      console.error('Error happened at the page:', error);
      await page.close();
    });
    page.on('pageerror', (error) => console.error('Page error occurred:', error));
    page.on('console', (msg) => {
      if (_.result(msg, 'type') === 'error') {
        console.error('Browser console error', JSON.stringify({text: msg.text(), location: msg.location()}));
      }
    });

    await page.setDefaultNavigationTimeout(0);

    return page;
  }

  private async acquirePage(): Promise<puppeteer.Page> {
    if (this.freePages.length) {
      return this.freePages.pop();
    }

    return setTimeout(_.random(10, 100)).then(() => this.acquirePage());
  }

  private releasePage(page) {
    this.freePages.push(page);
  }
}
