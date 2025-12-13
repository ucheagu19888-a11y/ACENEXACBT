
export interface MathProblem {
    id: string;
    text: string;
    options: string[];
    answer: string;
    type: 'ADD' | 'SUB' | 'MUL';
}

const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffle = (array: string[]) => {
    return array.sort(() => Math.random() - 0.5);
};

export const generateMathProblem = (level: number): MathProblem => {
    let type: 'ADD' | 'SUB' | 'MUL' = 'ADD';
    let a = 0, b = 0, ans = 0;
    
    // Difficulty logic
    if (level <= 3) {
        // Simple Addition
        type = 'ADD';
        a = getRandomInt(1, 10);
        b = getRandomInt(1, 10);
        ans = a + b;
    } else if (level <= 6) {
        // Simple Subtraction
        type = 'SUB';
        a = getRandomInt(5, 20);
        b = getRandomInt(1, a); // Ensure positive result
        ans = a - b;
    } else if (level <= 9) {
        // Mixed Add/Sub larger numbers
        type = Math.random() > 0.5 ? 'ADD' : 'SUB';
        if (type === 'ADD') {
            a = getRandomInt(10, 50);
            b = getRandomInt(5, 40);
            ans = a + b;
        } else {
            a = getRandomInt(20, 99);
            b = getRandomInt(5, 19);
            ans = a - b;
        }
    } else {
        // Multiplication & Mixed
        const r = Math.random();
        if (r < 0.3) {
            type = 'ADD';
            a = getRandomInt(20, 100);
            b = getRandomInt(20, 100);
            ans = a + b;
        } else if (r < 0.6) {
            type = 'SUB';
            a = getRandomInt(50, 100);
            b = getRandomInt(10, 49);
            ans = a - b;
        } else {
            type = 'MUL';
            a = getRandomInt(2, 9);
            b = getRandomInt(2, 9);
            ans = a * b;
        }
    }

    let operator = '+';
    if (type === 'SUB') operator = '-';
    if (type === 'MUL') operator = '×';

    // Generate Options
    const options = new Set<string>();
    options.add(ans.toString());

    while(options.size < 4) {
        const offset = getRandomInt(-5, 5);
        if (offset !== 0) {
            const fake = ans + offset;
            if (fake >= 0) options.add(fake.toString());
        }
    }

    return {
        id: `math-${Date.now()}-${Math.random()}`,
        text: `${a} ${operator} ${b} = ?`,
        options: shuffle(Array.from(options)),
        answer: ans.toString(),
        type
    };
};
