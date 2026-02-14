import fs from 'fs';
import path from 'path';

interface GoldenCase {
    id: string;
    label: string;
    imagePath: string;
    prompt?: string;
    expectedCategory: string;
    expectedType: string;
}

interface EvalResult {
    testCase: GoldenCase;
    rank: number | null;
    hitAt1: boolean;
    hitAt3: boolean;
    hitAt5: boolean;
    mrr: number;
}

/**
 * Quality Evaluation Script (Automated Hit@K and MRR)
 * Run with: npx ts-node scripts/evaluate-quality.ts
 */
async function evaluate() {
    console.log('🚀 Starting Quality Evaluation...');

    const goldenSetPath = path.join(__dirname, '../golden-set.json');
    if (!fs.existsSync(goldenSetPath)) {
        console.error(`❌ Golden set File not found: ${goldenSetPath}`);
        process.exit(1);
    }

    const goldenSet: GoldenCase[] = JSON.parse(fs.readFileSync(goldenSetPath, 'utf8'));

    // API URL usually points to local dev or production-like docker
    const API_URL = process.env.API_URL || 'http://localhost:4000/api/search';
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('❌ Error: GEMINI_API_KEY environment variable is required.');
        console.log('Fix: export GEMINI_API_KEY=your_key_here');
        process.exit(1);
    }

    const evalResults: EvalResult[] = [];

    for (const testCase of goldenSet) {
        process.stdout.write(`🔍 Testing: ${testCase.label.padEnd(40)} `);

        const imageAbsPath = path.join(__dirname, '../', testCase.imagePath);

        if (!fs.existsSync(imageAbsPath)) {
            console.log('⚠️  [SKIP: Image missing]');
            continue;
        }

        const imageBuffer = fs.readFileSync(imageAbsPath);

        // Prepare multipart form data (Node 20+ supports FormData and fetch)
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        formData.append('image', blob, path.basename(testCase.imagePath));
        if (testCase.prompt) formData.append('prompt', testCase.prompt);

        try {
            const start = Date.now();
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'x-ai-api-key': API_KEY
                },
                body: formData
            });

            const duration = Date.now() - start;

            if (!response.ok) {
                const errText = await response.text();
                console.log(`❌ [API Error: ${response.status}]`);
                continue;
            }

            const jsonResponse = await response.json() as any;
            const candidates = jsonResponse.data?.results || [];

            // Find rank of expected item by ID or Title
            // In a real evaluation, we check if the correct item is in the top results.
            const rank = candidates.findIndex((c: any) =>
                c.id === testCase.id ||
                c.title.toLowerCase().includes(testCase.id.toLowerCase().replace(/_/g, ' '))
            ) + 1;

            evalResults.push({
                testCase,
                rank: rank > 0 ? rank : null,
                hitAt1: rank === 1,
                hitAt3: rank > 0 && rank <= 3,
                hitAt5: rank > 0 && rank <= 5,
                mrr: rank > 0 ? 1 / rank : 0
            });

            if (rank > 0) {
                console.log(`✅ Rank ${rank} (${duration}ms)`);
            } else {
                console.log('🔴 Not found');
            }
        } catch (error: any) {
            console.log(`❌ [Fetch Error: ${error.message}]`);
        }
    }

    if (evalResults.length === 0) {
        console.log('\n❌ No successful tests recorded. Check your connection or image paths.');
        return;
    }

    // Compute aggregate metrics
    const total = evalResults.length;
    const hitAt1Count = evalResults.filter(r => r.hitAt1).length;
    const hitAt3Count = evalResults.filter(r => r.hitAt3).length;
    const hitAt5Count = evalResults.filter(r => r.hitAt5).length;
    const avgMrr = evalResults.reduce((sum, r) => sum + r.mrr, 0) / total;

    console.log('\n' + '='.repeat(40));
    console.log('       EVALUATION REPORT');
    console.log('='.repeat(40));
    console.log(`Total Scenarios:  ${total}`);
    console.log(`Hit@1 Precision:  ${(hitAt1Count / total * 100).toFixed(1)}%`);
    console.log(`Hit@3 Coverage:   ${(hitAt3Count / total * 100).toFixed(1)}%`);
    console.log(`Hit@5 Coverage:   ${(hitAt5Count / total * 100).toFixed(1)}%`);
    console.log(`Mean MRR:         ${avgMrr.toFixed(4)}`);
    console.log('='.repeat(40));
    console.log(`Report generated on: ${new Date().toLocaleString()}\n`);
}

evaluate().catch(err => {
    console.error('💥 Fatal evaluation error:', err);
    process.exit(1);
});
