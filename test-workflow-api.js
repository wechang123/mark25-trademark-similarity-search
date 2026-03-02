// Test script for workflow monitoring API
const baseUrl = 'http://localhost:3000';

async function testWorkflowAPIs() {
  console.log('🧪 Testing Workflow Monitoring APIs...\n');
  
  try {
    // Test 1: List workflows
    console.log('1️⃣ Testing /api/admin/workflow/list...');
    const listResponse = await fetch(`${baseUrl}/api/admin/workflow/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 10,
        offset: 0
      })
    });
    
    if (!listResponse.ok) {
      console.log(`   ❌ Failed with status: ${listResponse.status} ${listResponse.statusText}`);
      const error = await listResponse.text();
      console.log(`   Error: ${error}`);
    } else {
      const data = await listResponse.json();
      console.log(`   ✅ Success! Found ${data.workflows?.length || 0} workflows`);
      
      // Test 2: Get specific workflow details if we have any
      if (data.workflows && data.workflows.length > 0) {
        const firstWorkflow = data.workflows[0];
        console.log(`\n2️⃣ Testing /api/admin/workflow/${firstWorkflow.id}...`);
        
        const detailResponse = await fetch(`${baseUrl}/api/admin/workflow/${firstWorkflow.id}`);
        
        if (!detailResponse.ok) {
          console.log(`   ❌ Failed with status: ${detailResponse.status} ${detailResponse.statusText}`);
          const error = await detailResponse.text();
          console.log(`   Error: ${error}`);
        } else {
          const detailData = await detailResponse.json();
          console.log(`   ✅ Success! Retrieved workflow details`);
          console.log(`   - Session ID: ${detailData.session?.id}`);
          console.log(`   - Trademark: ${detailData.session?.trademark_name}`);
          console.log(`   - Status: ${detailData.session?.status}`);
          console.log(`   - API Calls: ${detailData.apiCalls?.length || 0}`);
          console.log(`   - Data Processing Logs: ${detailData.dataProcessing?.length || 0}`);
          console.log(`   - Checkpoints: ${detailData.checkpoints?.length || 0}`);
          console.log(`   - KIPRIS Searches: ${detailData.kiprisSearches?.length || 0}`);
        }
      } else {
        console.log('\n⚠️  No workflows found to test detailed endpoint');
      }
    }
    
    console.log('\n✨ Test completed!');
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error);
  }
}

// Run the tests
testWorkflowAPIs();