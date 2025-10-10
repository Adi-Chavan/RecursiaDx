// Test if we can fetch the demo sample from the API
import fetch from 'node-fetch';

async function testDemoSampleFetch() {
  try {
    console.log('🔧 Testing demo sample API endpoint...');
    
    const response = await fetch('http://localhost:5001/api/samples/demo-sample');
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Demo sample fetched successfully!');
    console.log(`📊 Sample ID: ${result.data?.sample?.sampleId}`);
    console.log(`🖼️ Images: ${result.data?.sample?.images?.length || 0}`);
    
    // Check heatmap data
    if (result.data?.sample?.images) {
      result.data.sample.images.forEach((img, index) => {
        console.log(`  Image ${index + 1}: ${img.filename}`);
        if (img.heatmap) {
          console.log(`    ✅ Has heatmap: ${img.heatmap.filename}`);
          console.log(`    📊 Analytics: ${img.heatmap.analytics ? 'Yes' : 'No'}`);
          console.log(`    🎨 Type: ${img.heatmap.type}, Colormap: ${img.heatmap.colormap}`);
        } else {
          console.log(`    ❌ No heatmap data`);
        }
      });
    }
    
    console.log('\n🎯 API is working! The issue might be in the frontend connection.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDemoSampleFetch();