// Quick test to check existing samples and their heatmap data
import mongoose from 'mongoose';
import Sample from './models/Sample.js';

async function checkSamples() {
  try {
    await mongoose.connect('mongodb://localhost:27017/recursiadx');
    console.log('📊 Connected to MongoDB');
    
    const samples = await Sample.find({}).limit(5);
    console.log(`📋 Found ${samples.length} samples`);
    
    samples.forEach((sample, index) => {
      console.log(`\n🔬 Sample ${index + 1} (${sample._id}):`);
      console.log(`  - Images: ${sample.images.length}`);
      
      sample.images.forEach((img, imgIndex) => {
        console.log(`    Image ${imgIndex + 1}: ${img.filename}`);
        if (img.heatmap) {
          console.log(`      ✅ Has heatmap: ${img.heatmap.path || img.heatmap.imagePath}`);
          console.log(`      📊 Analytics: ${img.heatmap.analytics ? 'Yes' : 'No'}`);
        } else {
          console.log(`      ❌ No heatmap data`);
        }
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSamples();