import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

async function testBatchPredict() {
    console.log('🧪 Testing ML Server /batch_predict endpoint directly');
    
    const testImagePath = './uploads/images-1760027203487-481259639.jpg';
    
    if (!fs.existsSync(testImagePath)) {
        console.error('❌ Test image not found:', testImagePath);
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('images', fs.createReadStream(testImagePath), 'test.jpg');
        
        console.log('📤 Calling ML server /batch_predict...');
        const response = await fetch('http://localhost:5000/batch_predict', {
            method: 'POST',
            body: formData,
            timeout: 30000
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Success:', JSON.stringify(result, null, 2));
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testBatchPredict();