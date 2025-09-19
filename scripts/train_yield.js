#!/usr/bin/env node

/**
 * AI Yield Training Script
 * Trains Stable Baselines3 RL model to optimize yield allocation
 * based on trader performance data from Supabase
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PYTHON_SCRIPT = path.join(__dirname, 'train_yield.py');
const MODEL_OUTPUT = path.join(__dirname, '..', 'models', 'yield_model.json');

// Ensure models directory exists
const modelsDir = path.dirname(MODEL_OUTPUT);
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

console.log('🚀 Starting AI Yield Training...');
console.log('📊 Loading trader performance data from Supabase...');

// Spawn Python training script
const pythonProcess = spawn('python', [PYTHON_SCRIPT], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
        ...process.env,
        MODEL_OUTPUT_PATH: MODEL_OUTPUT,
    }
});

// Handle Python script output
pythonProcess.stdout.on('data', (data) => {
    console.log(`📈 ${data.toString().trim()}`);
});

pythonProcess.stderr.on('data', (data) => {
    console.error(`⚠️  ${data.toString().trim()}`);
});

pythonProcess.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Yield model training completed successfully!');
        console.log(`💾 Model saved to: ${MODEL_OUTPUT}`);

        // Verify model file exists
        if (fs.existsSync(MODEL_OUTPUT)) {
            const stats = fs.statSync(MODEL_OUTPUT);
            console.log(`📊 Model file size: ${(stats.size / 1024).toFixed(2)} KB`);
        } else {
            console.error('❌ Model file was not created!');
            process.exit(1);
        }
    } else {
        console.error(`❌ Training failed with exit code: ${code}`);
        process.exit(1);
    }
});

pythonProcess.on('error', (error) => {
    console.error('❌ Failed to start Python process:', error);
    console.error('💡 Make sure Python is installed and stable-baselines3 is available');
    process.exit(1);
});

// Handle script interruption
process.on('SIGINT', () => {
    console.log('\n🛑 Training interrupted by user');
    pythonProcess.kill('SIGINT');
    process.exit(0);
});

console.log('🎯 Training Stable Baselines3 RL model for yield optimization...');
console.log('⏱️  This may take several minutes...\n');
