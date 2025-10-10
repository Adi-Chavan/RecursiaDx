// Create a sample with uploaded image and generated heatmaps
import mongoose from 'mongoose';
import Sample from './models/Sample.js';

async function createSampleWithHeatmaps() {
  try {
    await mongoose.connect('mongodb://localhost:27017/recursiadx');
    console.log('📊 Connected to MongoDB');
    
    // Delete existing demo sample if it exists
    await Sample.deleteOne({ sampleId: 'SP-2025-DEMO-001' });
    console.log('🗑️ Cleaned up existing demo sample');
    
    // Create a sample with your uploaded image and generated heatmaps
    const sampleData = {
      sampleId: 'SP-2025-DEMO-001',
      patientInfo: {
        patientId: 'DEMO-HEATMAP-001',
        name: 'Heatmap Demo Patient',
        age: 45,
        gender: 'Male',
        medicalHistory: ['Demo patient for heatmap visualization']
      },
      sampleType: 'Blood Smear',
      collectionInfo: {
        collectionDate: new Date(),
        collectionTime: '10:00',
        collectionMethod: 'venipuncture'
      },
      images: [
        {
          filename: 'images-1760052311919-363969374.jpg',
          originalName: 'uploaded_sample_image.jpg',
          mimetype: 'image/jpeg',
          size: 7024,
          path: 'D:\\PROJECTS\\RecursiaDx\\RecursiaDx\\backend\\uploads\\images-1760052311919-363969374.jpg',
          uploadedAt: new Date(),
          heatmap: {
            filename: 'heatmap_hot.png',
            path: '/api/samples/heatmap/heatmap_hot.png',
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
          }
        },
        {
          filename: 'images-1760052311919-363969374.jpg',
          originalName: 'confidence_analysis.jpg',
          mimetype: 'image/jpeg',
          size: 7024,
          path: 'D:\\PROJECTS\\RecursiaDx\\RecursiaDx\\backend\\uploads\\images-1760052311919-363969374.jpg',
          uploadedAt: new Date(),
          heatmap: {
            filename: 'heatmap_viridis.png',
            path: '/api/samples/heatmap/heatmap_viridis.png',
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
          }
        },
        {
          filename: 'images-1760052311919-363969374.jpg',
          originalName: 'risk_assessment.jpg',
          mimetype: 'image/jpeg',
          size: 7024,
          path: 'D:\\PROJECTS\\RecursiaDx\\RecursiaDx\\backend\\uploads\\images-1760052311919-363969374.jpg',
          uploadedAt: new Date(),
          heatmap: {
            filename: 'heatmap_plasma.png',
            path: '/api/samples/heatmap/heatmap_plasma.png',
            type: 'risk_score',
            colormap: 'plasma',
            analytics: {
              min_value: 0.2685816582514944,
              max_value: 0.8378640996056985,
              mean_value: 0.5513551464485202,
              std_value: 0.1452114761049256,
              shape: [16, 16],
              hotspots: 42,
              total_pixels: 256
            },
            generatedAt: new Date()
          }
        }
      ],
      aiAnalysis: {
        overallPrediction: 'benign',
        averageConfidence: 0.85,
        highRiskImages: 0,
        totalImagesAnalyzed: 3,
        recommendations: ['Routine monitoring'],
        flaggedFindings: [],
        batchAnalyzedAt: new Date(),
        modelInfo: {
          name: 'ResNet50-TumorClassifier',
          version: '1.0.0',
          accuracy: 0.94
        }
      },
      status: 'Completed',
      priority: 'Normal',
      workflow: {
        receivedAt: new Date(),
        estimatedCompletionTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      notes: ['Demo sample with auto-generated heatmaps for UI testing']
    };
    
    const sample = await Sample.create(sampleData);
    console.log('✅ Demo sample created with heatmaps!');
    console.log(`📊 Sample ID: ${sample.sampleId}`);
    console.log(`🎨 Images with heatmaps: ${sample.images.length}`);
    
    console.log('\n🎯 Success! Now check the frontend "Auto Heatmaps" tab:');
    console.log('   1. Go to http://localhost:5173');
    console.log('   2. Navigate to Analysis Dashboard');
    console.log('   3. Click "Auto Heatmaps" tab');
    console.log('   4. Select your sample from dropdown');
    console.log('   5. See the beautiful matplotlib heatmaps! 🔥');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSampleWithHeatmaps();