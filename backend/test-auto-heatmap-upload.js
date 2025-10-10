// Test upload to verify auto-heatmap generation
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUploadWithHeatmap() {
  try {
    console.log('🔧 Testing upload with auto-heatmap generation...');
    
    // Use an existing test image
    const testImagePath = path.join(process.cwd(), 'uploads', 'test_image.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found, creating a placeholder...');
      // Create a simple test file if the image doesn't exist
      fs.writeFileSync(testImagePath, 'dummy image content for testing');
    }
    
    // Create form data for upload
    const form = new FormData();
    form.append('sampleData', JSON.stringify({
      sampleType: 'Blood Smear',
      collectionInfo: {
        collectionDate: new Date().toISOString(),
        collectionTime: '09:00',
        collectionMethod: 'venipuncture',
        fasting: false
      },
      patientInfo: {
        patientId: 'AUTO-TEST-001',
        name: 'Auto-Heatmap Test Patient',
        age: 45,
        gender: 'Male',
        medicalHistory: 'Test patient for auto-heatmap verification'
      },
      urgency: 'routine',
      notes: 'Automated test upload for heatmap generation verification'
    }));
    
    form.append('images', fs.createReadStream(testImagePath), {
      filename: 'auto_heatmap_test.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('📤 Uploading sample to trigger auto-heatmap generation...');
    const response = await fetch('http://localhost:5001/api/samples/upload-with-analysis', {
      method: 'POST',
      body: form
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Upload successful!');
    console.log('📊 Full response:', JSON.stringify(result, null, 2));
    
    // Check if heatmap was generated
    if (result.data?.sample?.images) {
      result.data.sample.images.forEach((img, index) => {
        console.log(`\n🖼️ Image ${index + 1}: ${img.filename}`);
        if (img.heatmap) {
          console.log('  ✅ Heatmap generated!');
          console.log('  📁 Heatmap path:', img.heatmap.path || img.heatmap.imagePath);
          console.log('  📊 Analytics:', img.heatmap.analytics ? 'Yes' : 'No');
        } else {
          console.log('  ❌ No heatmap generated');
        }
      });
    }
    
    console.log('\n🎯 Now check the frontend "Auto Heatmaps" tab to see the results!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUploadWithHeatmap();