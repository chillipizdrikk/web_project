const { parentPort, workerData } = require('worker_threads');

// Лог для діагностики старту воркера
console.log(`Worker started with number: ${workerData.number}`);

// Функція для паузи (симуляція трудомісткості)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Основна функція для обчислення факторіалу
const calculateFactorial = async (num) => {
    try {
        // Перевірка на недопустимі вхідні дані
        if (typeof num !== 'number' || num < 0) {
            throw new Error('Invalid input: number must be a non-negative integer');
        }

        if (num === 0 || num === 1) return 1;

        let factorial = 1;
        for (let i = 2; i <= num; i++) {
            factorial *= i;

            // Відправка прогресу кожні 10% або на завершальній ітерації
            if (i % Math.floor(num / 10) === 0 || i === num) {
                const progress = (i / num) * 100;
                console.log(`Progress: ${progress.toFixed(2)}%`);
                parentPort.postMessage({ progress });
            }

            // Затримка для симуляції
            await sleep(2); // Можна налаштувати час затримки
        }

        return factorial;
    } catch (error) {
        console.error(`Error during factorial calculation: ${error.message}`);
        throw error; // Передаємо помилку для обробки
    }
};

// Головна асинхронна функція воркера
(async () => {
    try {
        // Виконуємо розрахунок
        const result = await calculateFactorial(workerData.number);

        // Лог результату для діагностики
        console.log(`Worker finished with result: ${result}`);

        // Відправляємо результат у головний потік
        parentPort.postMessage({ result });
    } catch (error) {
        // Відправляємо повідомлення про помилку у головний потік
        parentPort.postMessage({ error: error.message });
    }
})();
