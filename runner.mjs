import {execSync} from 'child_process';

const sizes = ['small', 'medium', 'large'];
const engines = ['chrome', 'pdfmake'];

execSync('docker compose up static-images -d')

for (const size of sizes) {
    for (let concurrency = 1; concurrency < 55; concurrency += 5) {
        for (let engine of engines) {
            console.log('--- start ---', {size, concurrency, engine});
            execSync(`INSTANCE_SIZE=${size} INSTANCES_CONCURRENCY=${concurrency} ENGINE=${engine} docker compose up pdf-generation`, {stdio: 'inherit'})
        }
    }
}
