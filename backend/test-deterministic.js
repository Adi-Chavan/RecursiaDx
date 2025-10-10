/**
 * Test script to verify deterministic ML predictions
 * This script tests the same image multiple times to ensure consistent results
 */

import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

const ML_SERVER_URL = 'http://localhost:5000';
const TEST_IMAGE_PATH = './uploads/images-1760027203487-481259639.jpg'; // Use existing test image

async function testDeterministicPrediction() {
    console.log('🧪 Testing ML Prediction Determinism');
    console.log('=' * 50);
    
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        console.error(`❌ Test image not found: ${TEST_IMAGE_PATH}`);
        console.error('Please ensure you have uploaded at least one image first.');
        return;
    }
    
    const results = [];
    const numTests = 5; // Test 5 times
    
    console.log(`📊 Running ${numTests} identical predictions on the same image...`);
    
    for (let i = 1; i <= numTests; i++) {
        console.log(`\n🔄 Test ${i}/${numTests}`);
        
        try {
            // Create form data
            const formData = new FormData();
            formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
            formData.append('enhance', 'false');
            formData.append('generate_heatmap', 'true');
            
            // Make prediction request
            const response = await fetch(`${ML_SERVER_URL}/predict`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Extract key values for comparison
            const keyData = {
                overall_probability: result.probabilities?.tumor || result.probability || 0,
                overall_confidence: result.confidence || 0,
                prediction: result.prediction,
                num_patches: result.patch_analysis?.total_patches || 0,
                heatmap_length: result.heatmap_data?.length || 0,
                // First few heatmap values for comparison
                first_heatmap_values: result.heatmap_data ? result.heatmap_data.slice(0, 5) : []
            };
            
            results.push(keyData);
            console.log(`✅ Result ${i}:`, JSON.stringify(keyData, null, 2));
            
        } catch (error) {
            console.error(`❌ Test ${i} failed:`, error.message);
            results.push({ error: error.message });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Analyze results for consistency
    console.log('\n📈 DETERMINISM ANALYSIS');
    console.log('=' * 50);
    
    // Check if all successful results are identical
    const successfulResults = results.filter(r => !r.error);
    
    if (successfulResults.length === 0) {
        console.error('❌ All tests failed - cannot analyze determinism');
        return;
    }
    
    if (successfulResults.length < numTests) {
        console.warn(`⚠️  Only ${successfulResults.length}/${numTests} tests succeeded`);
    }
    
    // Compare all results with the first one
    const referenceResult = successfulResults[0];
    let allIdentical = true;
    const differences = [];
    
    for (let i = 1; i < successfulResults.length; i++) {
        const currentResult = successfulResults[i];
        
        // Compare each field
        for (const [key, referenceValue] of Object.entries(referenceResult)) {
            const currentValue = currentResult[key];
            
            if (Array.isArray(referenceValue)) {
                // Compare arrays
                if (!arraysEqual(referenceValue, currentValue)) {
                    allIdentical = false;
                    differences.push(`Test ${i + 1}: ${key} differs`);
                    differences.push(`  Reference: [${referenceValue.join(', ')}]`);
                    differences.push(`  Current:   [${currentValue.join(', ')}]`);
                }
            } else if (typeof referenceValue === 'number') {
                // Compare numbers with small tolerance
                const tolerance = 1e-10;
                if (Math.abs(referenceValue - currentValue) > tolerance) {
                    allIdentical = false;
                    differences.push(`Test ${i + 1}: ${key} differs`);
                    differences.push(`  Reference: ${referenceValue}`);
                    differences.push(`  Current:   ${currentValue}`);
                    differences.push(`  Difference: ${Math.abs(referenceValue - currentValue)}`);
                }
            } else {
                // Compare other values
                if (referenceValue !== currentValue) {
                    allIdentical = false;
                    differences.push(`Test ${i + 1}: ${key} differs`);
                    differences.push(`  Reference: ${referenceValue}`);
                    differences.push(`  Current:   ${currentValue}`);
                }
            }
        }
    }
    
    // Report results
    if (allIdentical) {
        console.log('✅ SUCCESS: All predictions are deterministic!');
        console.log('🎯 The model produces identical results for the same input.');
    } else {
        console.log('❌ FAILURE: Predictions are NON-deterministic!');
        console.log('🔍 Differences found:');
        differences.forEach(diff => console.log(`   ${diff}`));
        
        console.log('\n🛠️  RECOMMENDED FIXES:');
        console.log('   1. Ensure all random seeds are set in Python ML server');
        console.log('   2. Set PyTorch to deterministic mode');
        console.log('   3. Remove any np.random.normal() calls in prediction code');
        console.log('   4. Ensure model.eval() is called before inference');
        console.log('   5. Disable CUDA non-deterministic operations');
    }
    
    // Show detailed results
    console.log('\n📋 DETAILED RESULTS:');
    console.log('=' * 50);
    successfulResults.forEach((result, i) => {
        console.log(`Test ${i + 1}:`, JSON.stringify(result, null, 2));
    });
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i] - b[i]) > 1e-10) return false;
    }
    return true;
}

// Run the test
testDeterministicPrediction().catch(console.error);
