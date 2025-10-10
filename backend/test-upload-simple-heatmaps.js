// Test the upload-simple endpoint with auto-heatmap generation
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUploadSimpleWithHeatmaps() {
  try {
    console.log('🔧 Testing upload-simple endpoint with auto-heatmap generation...');
    
    // Use an existing test image
    const testImagePath = path.join(process.cwd(), 'uploads', 'test_image.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found, creating a placeholder...');
      fs.writeFileSync(testImagePath, 'dummy image content for testing');
    }
    
    // Create form data for upload
    const form = new FormData();
    form.append('patientInfo', JSON.stringify({
      name: 'Heatmap Test Patient',
      age: 45,
      gender: 'Male'
    }));
    
    form.append('images', fs.createReadStream(testImagePath), {
      filename: 'heatmap_test.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('📤 Uploading to /api/upload-simple...');
    const response = await fetch('http://localhost:5001/api/upload-simple', {
      method: 'POST',
      body: form
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Upload successful!');
    console.log('📊 Sample ID:', result.sample?.id);
    
    // Check if heatmaps were generated
    if (result.sample?.images) {
      result.sample.images.forEach((img, index) => {
        console.log(`\n🖼️ Image ${index + 1}: ${img.filename}`);
        if (img.heatmap) {
          console.log('  ✅ Heatmap generated!');
          console.log('  📁 Heatmap filename:', img.heatmap.filename);
          console.log('  🎨 Type:', img.heatmap.type);
          console.log('  🌈 Colormap:', img.heatmap.colormap);
          console.log('  📊 Analytics:', img.heatmap.analytics ? 'Yes' : 'No');
        } else {
          console.log('  ❌ No heatmap generated');
        }
      });
    }
    
    console.log('\n🎯 Now the heatmaps should show in your AI Analytics dashboard!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUploadSimpleWithHeatmaps();