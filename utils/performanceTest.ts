/**
 * Performance Testing Utility
 * Simple script to measure API response times
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface PerformanceResult {
    endpoint: string;
    duration: number;
    status: number;
    success: boolean;
}

async function measureEndpoint(
    endpoint: string,
    options: RequestInit = {}
): Promise<PerformanceResult> {
    const startTime = performance.now();

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const endTime = performance.now();

        return {
            endpoint,
            duration: endTime - startTime,
            status: response.status,
            success: response.ok,
        };
    } catch (error) {
        const endTime = performance.now();
        return {
            endpoint,
            duration: endTime - startTime,
            status: 0,
            success: false,
        };
    }
}

async function runPerformanceTests() {
    console.log('🚀 Starting Performance Tests...\n');

    const results: PerformanceResult[] = [];

    // Test 1: Tickets API
    console.log('Testing /api/tickets...');
    const ticketsResult = await measureEndpoint('/api/tickets?limit=100');
    results.push(ticketsResult);
    console.log(`✓ Duration: ${ticketsResult.duration.toFixed(2)}ms\n`);

    // Test 2: Scan Logs API
    console.log('Testing /api/scan-logs...');
    const scanLogsResult = await measureEndpoint('/api/scan-logs?limit=50');
    results.push(scanLogsResult);
    console.log(`✓ Duration: ${scanLogsResult.duration.toFixed(2)}ms\n`);

    // Summary
    console.log('📊 Performance Summary:');
    console.log('═'.repeat(50));

    results.forEach(result => {
        const status = result.success ? '✓' : '✗';
        const color = result.duration < 300 ? '🟢' : result.duration < 1000 ? '🟡' : '🔴';
        console.log(`${status} ${color} ${result.endpoint}`);
        console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
        console.log(`   Status: ${result.status}`);
    });

    console.log('═'.repeat(50));

    // Performance targets
    const targets = {
        '/api/tickets': 300,
        '/api/scan-logs': 300,
    };

    console.log('\n🎯 Performance Targets:');
    results.forEach(result => {
        const target = targets[result.endpoint as keyof typeof targets];
        if (target) {
            const percentage = ((target - result.duration) / target * 100).toFixed(1);
            const status = result.duration < target ? '✓ PASS' : '✗ FAIL';
            console.log(`${status} ${result.endpoint}: ${result.duration.toFixed(2)}ms (target: ${target}ms, ${percentage}% ${result.duration < target ? 'faster' : 'slower'})`);
        }
    });
}

// Run tests
if (typeof window === 'undefined') {
    // Node.js environment
    runPerformanceTests().catch(console.error);
} else {
    // Browser environment
    console.log('Run this script in Node.js environment');
}

export { measureEndpoint, runPerformanceTests };
