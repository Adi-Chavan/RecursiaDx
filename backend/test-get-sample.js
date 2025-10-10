import fetch from 'node-fetch';

async function testGetSample() {
    console.log('🔍 Testing sample retrieval...');
    
    try {
        const response = await fetch('http://localhost:5001/api/samples/SP-2025-0005');
        
        if (response.ok) {
            const sample = await response.json();
            console.log('✅ Sample retrieved successfully:');
            console.log('📊 Sample ID:', sample.data.sampleId);
            console.log('👤 Patient:', sample.data.patientInfo.name);
            console.log('🖼️  Images:', sample.data.images.length);
            
            if (sample.data.images.length > 0) {
                const firstImage = sample.data.images[0];
                console.log('📸 First image ML analysis:');
                console.log('   - Filename:', firstImage.filename);
                console.log('   - ML Analysis:', firstImage.mlAnalysis ? 'Present' : 'Missing');
                console.log('   - Heatmap:', firstImage.heatmap ? 'Present' : 'Missing');
                
                if (firstImage.mlAnalysis) {
                    console.log('   - Prediction:', firstImage.mlAnalysis.prediction);
                    console.log('   - Confidence:', firstImage.mlAnalysis.confidence);
                }
                
                if (firstImage.heatmap) {
                    console.log('   - Heatmap type:', firstImage.heatmap.type);
                    console.log('   - Colormap:', firstImage.heatmap.colormap);
                    console.log('   - Has base64:', firstImage.heatmap.base64 ? 'Yes' : 'No');
                }
            }
        } else {
            console.log('❌ Failed to retrieve sample:', response.status);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testGetSample();