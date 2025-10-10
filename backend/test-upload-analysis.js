import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

async function testUploadWithAnalysis() {
    console.log('🧪 Testing /api/samples/upload-with-analysis endpoint');
    
    const testImagePath = './uploads/images-1760027203487-481259639.jpg';
    
    if (!fs.existsSync(testImagePath)) {
        console.error('❌ Test image not found:', testImagePath);
        return;
    }
    
    try {
        const formData = new FormData();
        
        // Add sample data
        const sampleData = {
            patientInfo: {
                patientId: 'TEST-001',
                name: 'Test Patient',
                age: 45,  // Number, not string
                gender: 'Male'  // Capitalized
            },
            sampleType: 'Tissue Biopsy',
            specimenDetails: {
                organ: 'Lung',
                site: 'Left lobe'
            },
            clinicalInfo: {
                clinicalDiagnosis: 'Test diagnosis',
                symptoms: [],
                duration: '2 weeks',
                urgency: 'Routine'
            },
            collectionInfo: {
                collectionDate: new Date().toISOString(),
                collectionTime: '10:30',
                collectionMethod: 'Biopsy',
                transportConditions: 'Room temperature'
            }
        };
        
        formData.append('sampleData', JSON.stringify(sampleData));
        formData.append('images', fs.createReadStream(testImagePath));
        
        console.log('📤 Sending request...');
        const response = await fetch('http://localhost:5001/api/samples/upload-with-analysis', {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Success:', result);
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testUploadWithAnalysis();