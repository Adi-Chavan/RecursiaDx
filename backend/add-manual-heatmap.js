// Manual heatmap assignment to demonstrate UI functionality
import mongoose from 'mongoose';
import Sample from './models/Sample.js';

async function addHeatmapToSample() {
  try {
    await mongoose.connect('mongodb://localhost:27017/recursiadx');
    console.log('📊 Connected to MongoDB');
    
    // Find the most recent sample
    const sample = await Sample.findOne({}).sort({ createdAt: -1 });
    
    if (!sample) {
      console.log('❌ No samples found');
      process.exit(1);
    }
    
    console.log(`🔬 Found sample: ${sample.sampleId}`);
    
    // Add multiple heatmap data to the first image
    if (sample.images && sample.images.length > 0) {
      sample.images[0].heatmap = {
        filename: 'heatmap_from_uploaded_sample.png',
        path: '/api/samples/heatmap/heatmap_from_uploaded_sample.png',
        type: 'tumor_probability',
        colormap: 'hot',
        analytics: {
          min_value: 0.0,
          max_value: 0.9073608271482184,
          mean_value: 0.28915497976794247,
          std_value: 0.234978657554125,
          shape: [16, 16],
          hotspots: 17,
          total_pixels: 256
        },
        generatedAt: new Date()
      };
      
      // Add additional heatmap variations if there are more images
      if (sample.images.length > 1) {
        sample.images[1].heatmap = {
          filename: 'confidence_heatmap.png',
          path: '/api/samples/heatmap/confidence_heatmap.png',
          type: 'confidence',
          colormap: 'viridis',
          analytics: {
            min_value: 0.3768195980284063,
            max_value: 0.9339579326308897,
            mean_value: 0.6236872365395125,
            std_value: 0.1339540600255726,
            shape: [16, 16],
            hotspots: 85,
            total_pixels: 256
          },
          generatedAt: new Date()
        };
      }
      
      await sample.save();
      console.log('✅ Heatmap data added to sample!');
      console.log('🎯 Now check the frontend "Auto Heatmaps" tab to see the results!');
    } else {
      console.log('❌ No images found in sample');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addHeatmapToSample();