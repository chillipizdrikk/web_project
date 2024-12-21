const { parentPort, workerData } = require('worker_threads');

// Лог для діагностики старту воркера
console.log(`Worker started with input: ${workerData.number}`);

// Функція для паузи (симуляція трудомісткості)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Основна функція для обчислення факторіалу
const calculateFactorial = async (num) => {
    try {
        // Приведення до числа
        num = Number(num);

        // Перевірка на недопустимі вхідні дані
        if (!Number.isInteger(num) || num < 0) {
            throw new Error('Invalid input: number must be a non-negative integer');
        }

        if (num === 0 || num === 1) return 1; // Факторіал для 0 та 1 дорівнює 1

        let factorial = 1;

        for (let i = 2; i <= num; i++) {
            factorial *= i;

            // Відправка прогресу кожні 10% або на завершальній ітерації
            if (num >= 10 && (i % Math.floor(num / 10) === 0 || i === num)) {
                const progress = (i / num) * 100;
                parentPort.postMessage({ progress });
            }

            // Затримка для симуляції
            await sleep(2); // Налаштуй час затримки за потребою
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
        const { number } = workerData;

        // Виконуємо розрахунок
        const result = await calculateFactorial(number);

        // Лог результату для діагностики
        console.log(`Worker finished with result: ${result}`);

        // Відправляємо результат у головний потік
        parentPort.postMessage({ result });
    } catch (error) {
        // Лог помилки для діагностики
        console.error(`Worker encountered an error: ${error.message}`);

        // Відправляємо повідомлення про помилку у головний потік
        parentPort.postMessage({ error: error.message });
    }
})();
