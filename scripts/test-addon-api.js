// Test addon API endpoints
// Run with: node scripts/test-addon-api.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAddonAPI() {
  console.log('🧪 Testing Addon API...\n');

  try {
    // Test GET all addons
    console.log('📋 Testing GET /api/addons');
    const getResponse = await fetch(`${BASE_URL}/api/addons`);
    console.log('Status:', getResponse.status);

    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('Addons found:', data.addons?.length || 0);
      if (data.addons && data.addons.length > 0) {
        console.log('First addon:', data.addons[0]);
      }
    } else {
      console.log('GET failed:', await getResponse.text());
    }

    console.log('\n---\n');

    // Test DELETE specific addon
    console.log('🗑️ Testing DELETE /api/addons?id=69e70dcd-2fc8-45ba-896c-53ca04c2aa33');
    const deleteResponse = await fetch(`${BASE_URL}/api/addons?id=69e70dcd-2fc8-45ba-896c-53ca04c2aa33`, {
      method: 'DELETE'
    });
    console.log('Status:', deleteResponse.status);

    const deleteResult = await deleteResponse.json();
    console.log('Response:', deleteResult);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAddonAPI();
