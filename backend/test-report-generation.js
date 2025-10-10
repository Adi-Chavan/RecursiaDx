import fetch from 'node-fetch';

async function testReportGeneration() {
    try {
        console.log('🧪 Testing Report Generation...');
        
        // Use the sample ID from our previous test
        const sampleId = '68e861a8a52938be8c316617'; // From our earlier test
        console.log('📋 Testing with sample ID:', sampleId);
        
        // Test report generation
        const reportResponse = await fetch(`http://localhost:5001/api/reports/generate/${sampleId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reportType: 'Preliminary',
                includeImages: true
            })
        });
        
        console.log('📥 Report Response Status:', reportResponse.status);
        
        if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            console.log('✅ Report Generated Successfully!');
            console.log('📊 Report Data:');
            console.log('   - Report ID:', reportData.data?.reportId);
            console.log('   - Status:', reportData.data?.status);
            console.log('   - Generated At:', reportData.data?.generatedAt);
            console.log('   - AI Analysis Available:', !!reportData.data?.aiAnalysis);
        } else {
            const errorText = await reportResponse.text();
            console.log('❌ Report Generation Failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testReportGeneration();