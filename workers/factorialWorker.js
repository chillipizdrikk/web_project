const { parentPort, workerData } = require('worker_threads');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const calculateFactorial = async (num) => {
    if (num === 0 || num === 1) return 1;
    let factorial = 1;
    for (let i = 2; i <= num; i++) {
        factorial *= i;
        // Відправляємо прогрес
        const progress = (i / num) * 100;
        parentPort.postMessage({ progress });
        // Додавання затримки для симуляції трудомісткості
        await sleep(20); // Затримка 10мс (можна змінювати)
    }
    return factorial;
};

(async () => {
    const result = await calculateFactorial(workerData.number);
    parentPort.postMessage({ result });
})();
