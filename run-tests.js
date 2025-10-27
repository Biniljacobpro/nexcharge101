const { exec } = require('child_process');
const path = require('path');

console.log('Running Playwright tests...');

// Run tests
const testProcess = exec('npx playwright test', { cwd: path.resolve(__dirname) });

testProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

testProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

testProcess.on('close', (code) => {
  console.log(`Tests finished with exit code ${code}`);
  
  if (code === 0) {
    console.log('Generating HTML report...');
    const reportProcess = exec('npx playwright show-report', { cwd: path.resolve(__dirname) });
    
    reportProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    reportProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    reportProcess.on('close', (reportCode) => {
      console.log(`Report generation finished with exit code ${reportCode}`);
    });
  } else {
    console.log('Tests failed, skipping report generation');
  }
});