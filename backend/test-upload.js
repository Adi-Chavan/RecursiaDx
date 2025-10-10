#!/usr/bin/env node

// Test script for upload endpoint
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUpload() {
  try {
    console.log('🔧 Testing upload endpoint...');
    
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    
    // Create a simple test file
    const testImagePath = path.join(process.cwd(), 'test-image.txt');
    fs.writeFileSync(testImagePath, 'This is a test image file content');
    
    // Create form data
    const form = new FormData();
    form.append('patientInfo', JSON.stringify({
      name: 'Test Patient',
      age: 45,
      gender: 'Male'
    }));
    form.append('images', fs.createReadStream(testImagePath), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('2. Testing upload endpoint...');
    const uploadResponse = await fetch('http://localhost:5001/api/upload-simple', {
      method: 'POST',
      body: form
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Upload successful!');
    console.log('📊 Response:', JSON.stringify(uploadData, null, 2));
    
    // Check if uploaded file exists
    const uploadedFile = uploadData.sample.images[0];
    const fileUrl = `http://localhost:5001${uploadedFile.url}`;
    console.log('🖼️ Testing file access:', fileUrl);
    
    const fileResponse = await fetch(fileUrl);
    if (fileResponse.ok) {
      console.log('✅ File accessible via URL');
    } else {
      console.log('❌ File not accessible:', fileResponse.status);
    }
    
    // Cleanup
    fs.unlinkSync(testImagePath);
    console.log('🧹 Test file cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUpload();