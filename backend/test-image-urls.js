import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

async function testUploadAndCheckImages() {
    console.log('🧪 Testing upload and checking image URLs');
    
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
                patientId: 'TEST-URL-001',
                name: 'Test Patient URL',
                age: 45,
                gender: 'Male'
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
        
        console.log('📤 Uploading image...');
        const response = await fetch('http://localhost:5001/api/samples/upload-with-analysis', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Upload successful');
            
            // Check image data structure
            if (result.data.sample.images && result.data.sample.images.length > 0) {
                const image = result.data.sample.images[0];
                console.log('📸 Image details:');
                console.log('   - Filename:', image.filename);
                console.log('   - Original name:', image.originalName);
                console.log('   - Path:', image.path);
                console.log('   - URL:', image.url);
                console.log('   - Has ML analysis:', !!image.mlAnalysis);
                console.log('   - Has heatmap:', !!image.heatmap);
                
                // Test if the URL is accessible
                if (image.url) {
                    const imageUrl = `http://localhost:5001${image.url}`;
                    console.log('🔗 Testing image URL:', imageUrl);
                    
                    const imageResponse = await fetch(imageUrl);
                    console.log('📥 Image URL status:', imageResponse.status);
                    
                    if (imageResponse.ok) {
                        console.log('✅ Image is accessible via URL');
                    } else {
                        console.log('❌ Image URL not accessible');
                    }
                } else {
                    console.log('❌ No URL field found in image data');
                }
            } else {
                console.log('❌ No images found in response');
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Upload failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testUploadAndCheckImages();