// Test the upload-with-analysis flow to debug heatmap issue
const FormData = require('form-data')
const fs = require('fs')
const fetch = require('node-fetch')
const path = require('path')

async function testUploadFlow() {
  try {
    console.log('🧪 Testing upload-with-analysis flow...')
    
    // Check if we have any test images
    const imagesDir = path.join(__dirname, 'uploads', 'images')
    
    if (!fs.existsSync(imagesDir)) {
      console.log('❌ No images directory found')
      return
    }
    
    const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    
    if (files.length === 0) {
      console.log('❌ No test images found in uploads/images')
      return
    }
    
    console.log(`📸 Found ${files.length} test images`)
    
    // Create form data
    const formData = new FormData()
    
    // Add sample data
    const sampleData = {
      patientInfo: {
        patientId: 'TEST-001',
        name: 'Test Patient',
        age: 45,
        gender: 'Female'
      },
      sampleType: 'Tissue Biopsy',
      specimenDetails: {
        organ: 'Breast',
        site: 'Left breast',
        size: '2cm'
      },
      clinicalInfo: {
        clinicalDiagnosis: 'Suspected tumor',
        symptoms: ['Lump detected'],
        urgency: 'High'
      },
      collectionInfo: {
        collectionDate: new Date().toISOString().split('T')[0],
        collectionTime: '10:30'
      }
    }
    
    formData.append('sampleData', JSON.stringify(sampleData))
    
    // Add first test image
    const testImagePath = path.join(imagesDir, files[0])
    const imageBuffer = fs.readFileSync(testImagePath)
    formData.append('images', imageBuffer, {
      filename: files[0],
      contentType: 'image/jpeg'
    })
    
    console.log(`📤 Uploading image: ${files[0]}`)
    
    // Send request
    const response = await fetch('http://localhost:5001/api/samples/upload-with-analysis', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    console.log('📥 Response status:', response.status)
    console.log('📥 Response:', JSON.stringify(result, null, 2))
    
    if (result.success && result.data && result.data.sample) {
      const sample = result.data.sample
      console.log('\n🔍 SAMPLE STRUCTURE ANALYSIS:')
      console.log('- Sample ID:', sample.sampleId)
      console.log('- Images count:', sample.images?.length || 0)
      
      if (sample.images && sample.images.length > 0) {
        sample.images.forEach((img, index) => {
          console.log(`\n📸 Image ${index + 1}:`)
          console.log('  - Filename:', img.filename)
          console.log('  - Original name:', img.originalName)
          console.log('  - URL:', img.url)
          console.log('  - Has ML analysis:', !!img.mlAnalysis)
          console.log('  - Has heatmap:', !!img.heatmap)
          
          if (img.mlAnalysis) {
            console.log('  - ML prediction:', img.mlAnalysis.prediction)
            console.log('  - ML confidence:', img.mlAnalysis.confidence)
          }
          
          if (img.heatmap) {
            console.log('  - Heatmap type:', img.heatmap.type)
            console.log('  - Heatmap path:', img.heatmap.path)
            console.log('  - Has base64:', !!img.heatmap.base64)
            console.log('  - Has analytics:', !!img.heatmap.analytics)
          }
        })
      }
      
      console.log('\n✅ Test completed successfully!')
    } else {
      console.log('❌ Test failed:', result.message || 'Unknown error')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Run the test
testUploadFlow()