import * as fs from 'fs';
import {execSync} from 'child_process';

const sizes = ['small', 'medium', 'large'];
const engines = ['chrome', 'pdfmake'];

execSync('docker compose up static-images -d')

let data = [];
if (fs.existsSync('./results/stats.json')) {
    data = JSON.parse(fs.readFileSync('./results/stats.json'));
}

for (const size of sizes) {
    for (let concurrency = 1; concurrency < 55; concurrency += 5) {
        for (let engine of engines) {
            const hasData = data.some((result) => {
                return result.engine === engine && result.concurrency === concurrency && result.instanceSize === size;
            });
            if (hasData) {
                console.log('--- skipping iteration ---', {size, concurrency, engine})
                continue;
            }

            console.log('--- start ---', {size, concurrency, engine});
            execSync(`INSTANCE_SIZE=${size} INSTANCES_CONCURRENCY=${concurrency} ENGINE=${engine} docker compose up pdf-generation`, {stdio: 'inherit'})
        }
    }
}
