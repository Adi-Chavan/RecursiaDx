import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testWSIViewer() {
    try {
        console.log('🧪 Testing WSI Viewer Image Loading');
        
        // 1. Upload a new sample
        console.log('📤 Uploading new sample...');
        
        const form = new FormData();
        
        // Use an existing test image
        const imagePath = path.join(__dirname, 'uploads', 'test_image.jpg');
        if (!fs.existsSync(imagePath)) {
            console.log('❌ Test image not found, using a recent upload');
            const uploadsDir = path.join(__dirname, 'uploads');
            const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpg'));
            if (files.length === 0) {
                throw new Error('No test images available');
            }
            const testFile = files[files.length - 1]; // Use most recent
            fs.copyFileSync(path.join(uploadsDir, testFile), imagePath);
        }
        
        form.append('images', fs.createReadStream(imagePath));
        form.append('sampleData', JSON.stringify({
            patientInfo: {
                patientId: 'WSI-TEST-001',
                name: 'WSI Test Patient',
                age: 45,
                gender: 'Female'
            },
            sampleType: 'Tissue Biopsy',
            specimenDetails: {
                organ: 'Lung',
                site: 'Left lobe'
            },
            clinicalInfo: {
                clinicalDiagnosis: 'WSI Test',
                symptoms: [],
                duration: '1 week',
                urgency: 'Routine'
            },
            collectionInfo: {
                collectionDate: new Date().toISOString().split('T')[0],
                collectionTime: '14:30',
                collectionMethod: 'Biopsy'
            }
        }));

        const response = await fetch('http://localhost:5001/api/samples/upload-with-analysis', {
            method: 'POST',
            body: form
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Upload successful');
            
            // 2. Check the sample structure
            console.log('\n📋 Sample Structure:');
            console.log('Sample ID:', result.data.sample._id);
            console.log('Images count:', result.data.sample.images?.length || 0);
            
            if (result.data.sample.images && result.data.sample.images.length > 0) {
                const image = result.data.sample.images[0];
                console.log('\n🖼️ First Image Details:');
                console.log('  - ID:', image._id);
                console.log('  - Filename:', image.filename);
                console.log('  - Original Name:', image.originalName);
                console.log('  - URL:', image.url);
                console.log('  - Has ML Analysis:', !!image.mlAnalysis);
                console.log('  - ML Prediction:', image.mlAnalysis?.prediction);
                console.log('  - ML Confidence:', image.mlAnalysis?.confidence);
                
                // 3. Test image URL accessibility
                if (image.url) {
                    const imageUrl = `http://localhost:5001${image.url}`;
                    console.log('\n🔗 Testing Image URL:', imageUrl);
                    
                    try {
                        const imageResponse = await fetch(imageUrl);
                        console.log('📥 Image Response Status:', imageResponse.status);
                        console.log('📥 Image Content-Type:', imageResponse.headers.get('content-type'));
                        console.log('📥 Image Content-Length:', imageResponse.headers.get('content-length'));
                        
                        if (imageResponse.ok) {
                            console.log('✅ Image URL is accessible');
                        } else {
                            console.log('❌ Image URL returned error:', imageResponse.statusText);
                        }
                    } catch (urlError) {
                        console.log('❌ Image URL test failed:', urlError.message);
                    }
                } else {
                    console.log('❌ No URL field in image data');
                }
                
                // 4. Simulate WSI Viewer data transformation
                console.log('\n🔄 WSI Viewer Data Transformation:');
                const wsiImage = {
                    id: image._id || image.filename,
                    name: image.originalName || image.filename,
                    type: result.data.sample.sampleType?.toLowerCase() || 'unknown',
                    resolution: image.magnification || 'Unknown',
                    staining: image.staining || 'H&E',
                    thumbnail: `http://localhost:5001${image.url}`,
                    fullImage: `http://localhost:5001${image.url}`,
                    analysis: image.mlAnalysis ? 'completed' : 'pending',
                    mlAnalysis: image.mlAnalysis,
                    uploadedAt: image.uploadedAt
                };
                
                console.log('🎯 WSI Image Object:');
                console.log(JSON.stringify(wsiImage, null, 2));
                
            } else {
                console.log('❌ No images found in sample');
            }
            
        } else {
            const errorText = await response.text();
            console.log('❌ Upload failed:', response.status, errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWSIViewer();