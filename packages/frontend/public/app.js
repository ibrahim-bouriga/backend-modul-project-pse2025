// Frontend application logic
document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend application loaded');
    
    // Test backend connection
    const testBackendBtn = document.getElementById('testBackend');
    const backendResponse = document.getElementById('backendResponse');
    
    if (testBackendBtn && backendResponse) {
        testBackendBtn.addEventListener('click', async () => {
            backendResponse.textContent = 'Connecting to backend...';
            backendResponse.className = 'response';
            
            try {
                const response = await fetch('http://localhost:4000/api/health');
                const data = await response.json();
                
                backendResponse.textContent = `✓ Backend connected! Message: ${data.message}`;
                backendResponse.className = 'response success';
            } catch (error) {
                backendResponse.textContent = `✗ Backend connection failed. Make sure the backend server is running on port 4000.`;
                backendResponse.className = 'response error';
            }
        });
    }
});
