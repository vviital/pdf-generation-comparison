const file = require('./results/stats.json');
const fs = require('fs');

const small = file.filter(({instanceSize}) => instanceSize === 'small');
const medium = file.filter(({instanceSize}) => instanceSize === 'medium');
const large = file.filter(({instanceSize}) => instanceSize === 'large');

print('small', small);
print('medium', medium);
print('large', large);

function print(prefix, set) {
  let recordSet = `Concurrency, ${generateLabel('chrome pdf generation')}, ${generateLabel(
    'pdfmake pdf generation',
  )}, ${generateLabel('pdfmake image download')}, ${generateLabel('pdfmake pdf creation')}\n`;

  for (let i = 1; i < 50; i += 5) {
    const chrome = set.find((s) => s.engine === 'chrome' && s.concurrency === i);
    const pdfmake = set.find((s) => s.engine === 'pdfmake' && s.concurrency === i);

    recordSet += `${i},${handleRecord(chrome?.['pdf-creation'])},${handleRecord(pdfmake?.all)},${handleRecord(
      pdfmake?.['image-download'],
    )},${handleRecord(pdfmake?.['pdf-creation'])}\n`;
  }

  fs.writeFileSync(`./measurements/${prefix}.csv`, recordSet);
}

function generateLabel(string) {
  return `Avg ${string}`;
  // return `Min ${string}, Avg ${string}, Max ${string}`;
}

function handleRecord(record = {}) {
  return `${record.avg}`;
  // return `${record.min},${record.avg},${record.max}`;
}
