// tests/upload-simple.test.js - Simple upload test without Jest
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:8080/api/v1';

async function testUpload() {
  console.log('\n📸 TESTING PHOTO UPLOAD\n' + '='.repeat(50));
  
  // Step 1: Login first
  console.log('→ Logging in...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123!@#'
    })
  });
  
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.log('❌ Login failed. Create a test user first.');
    console.log('   Run: node test-auth.js');
    return;
  }
  
  const token = loginData.data.token;
  console.log('✓ Logged in successfully');
  
  // Step 2: Create a test property
  console.log('\n→ Creating test property...');
  const propertyRes = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Test Property for Upload',
      description: 'Testing photo uploads',
      property_type: 'apartment',
      purpose: 'rent',
      price: 1000,
      bedrooms: 2,
      bathrooms: 1,
      city: 'Test City',
      country: 'Test Country'
    })
  });
  
  const propertyData = await propertyRes.json();
  if (!propertyData.success) {
    console.log('❌ Failed to create property:', propertyData.message);
    return;
  }
  
  const propertyId = propertyData.data.id;
  console.log(`✓ Property created: ${propertyId}`);
  
  // Step 3: Check for test image
  const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
  if (!fs.existsSync(testImagePath)) {
    console.log('\n⚠️ No test image found at:', testImagePath);
    console.log('\n💡 Create a test image:');
    console.log('   mkdir -p tests/fixtures');
    console.log('   # Add a test-image.jpg file to tests/fixtures/');
    console.log('\n📝 Or test with a real image:');
    console.log('   node tests/upload-simple.js /path/to/your/image.jpg');
    return;
  }
  
  // Step 4: Upload photo
  console.log('\n→ Uploading photo...');
  const formData = new FormData();
  formData.append('photos', fs.createReadStream(testImagePath));
  formData.append('caption', 'Test upload');
  
  const uploadRes = await fetch(`${API_BASE}/properties/${propertyId}/photos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const uploadData = await uploadRes.json();
  
  if (uploadRes.ok && uploadData.success) {
    console.log('✓ Photo uploaded successfully!');
    console.log(`   Photos uploaded: ${uploadData.data?.length || 1}`);
  } else {
    console.log('❌ Upload failed:', uploadData.message);
  }
  
  // Step 5: Get photos
  console.log('\n→ Fetching property photos...');
  const getPhotosRes = await fetch(`${API_BASE}/properties/${propertyId}/photos`);
  const photosData = await getPhotosRes.json();
  
  if (photosData.success) {
    console.log(`✓ Found ${photosData.data?.length || 0} photos`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Upload test completed!\n');
}

// Run test
testUpload().catch(console.error);