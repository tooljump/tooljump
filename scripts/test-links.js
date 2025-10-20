#!/usr/bin/env node

const { execSync } = require('child_process');
const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', 'coverage'];
const TIMEOUT_MS = 5000;

// Try to load puppeteer if available
let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  // Puppeteer not available, SPA mode will be disabled
}

/**
 * Extract all URLs matching the base URL from grep output
 * @param {string} grepOutput - Raw output from grep command
 * @param {string} baseUrl - Base URL to search for (e.g., 'https://tooljump.dev')
 * @returns {Set<string>} Set of unique URLs
 */
function extractUrls(grepOutput, baseUrl) {
  const urls = new Set();
  // Escape special regex characters in the base URL
  const escapedUrl = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlRegex = new RegExp(`${escapedUrl}[^\\s"')>\\]\`]*`, 'g');
  
  const matches = grepOutput.matchAll(urlRegex);
  for (const match of matches) {
    urls.add(match[0]);
  }
  
  return urls;
}

/**
 * Test a URL to ensure it returns a 2xx or 3xx status code
 * @param {string} testUrl - URL to test
 * @param {boolean} verbose - Whether to log verbose output
 * @returns {Promise<{url: string, status: number, ok: boolean, error?: string}>}
 */
function testUrl(testUrl, verbose = false) {
  return new Promise((resolve) => {
    const parsedUrl = url.parse(testUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'HEAD', // Use HEAD request for faster checking
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ToolJump-LinkChecker/1.0)',
        'Accept': '*/*'
      }
    };
    
    if (verbose) {
      console.log(`Testing: ${testUrl}`);
    }
    
    const req = protocol.request(options, (res) => {
      // Consider 2xx and 3xx as success
      const ok = res.statusCode >= 200 && res.statusCode < 400;
      
      if (verbose) {
        console.log(`  Status: ${res.statusCode}`);
      }
      
      resolve({
        url: testUrl,
        status: res.statusCode,
        ok
      });
      
      // Consume response to free up memory
      res.resume();
    });
    
    req.on('error', (error) => {
      if (verbose) {
        console.log(`  Error: ${error.message}`);
      }
      
      resolve({
        url: testUrl,
        status: 0,
        ok: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      
      if (verbose) {
        console.log(`  Error: Request timeout`);
      }
      
      resolve({
        url: testUrl,
        status: 0,
        ok: false,
        error: 'Request timeout'
      });
    });
    
    req.end();
  });
}

/**
 * Search the project for URLs matching the base URL
 * @param {string} baseUrl - Base URL to search for (e.g., 'https://tooljump.dev')
 * @returns {string} Grep output
 */
function searchForUrls(baseUrl) {
  const excludeArgs = EXCLUDED_DIRS.map(dir => `--exclude-dir=${dir}`).join(' ');
  
  try {
    // Using grep with recursive search, excluding specified directories
    const command = `grep -r ${excludeArgs} -h "${baseUrl}" . 2>/dev/null || true`;
    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    return output;
  } catch (error) {
    // grep returns non-zero if no matches, but we'll handle that
    return '';
  }
}

/**
 * Test a URL using Puppeteer to check for 404 in SPA
 * @param {string} testUrl - URL to test
 * @param {Object} browser - Puppeteer browser instance
 * @param {boolean} verbose - Whether to log verbose output
 * @returns {Promise<{url: string, status: number, ok: boolean, error?: string}>}
 */
async function testUrlSPA(testUrl, browser, verbose = false) {
  let page = null;
  try {
    if (verbose) {
      console.log(`Testing (SPA): ${testUrl}`);
    }
    
    page = await browser.newPage();
    const response = await page.goto(testUrl, { 
      waitUntil: 'networkidle2',
      timeout: TIMEOUT_MS 
    });
    
    // Check for common 404 indicators in the page content
    const pageContent = await page.content();
    const title = await page.title();
    
    const is404 = 
      pageContent.toLowerCase().includes('page not found') ||
      pageContent.toLowerCase().includes('404') ||
      title.toLowerCase().includes('page not found') ||
      title.toLowerCase().includes('404');
    
    const statusCode = response ? response.status() : 0;
    const ok = !is404 && statusCode >= 200 && statusCode < 400;
    
    if (verbose) {
      console.log(`  HTTP Status: ${statusCode}, Is404: ${is404}, Title: ${title}`);
    }
    
    await page.close();
    
    return {
      url: testUrl,
      status: is404 ? 404 : statusCode,
      ok
    };
  } catch (error) {
    if (page) {
      await page.close().catch(() => {});
    }
    
    if (verbose) {
      console.log(`  Error: ${error.message}`);
    }
    
    return {
      url: testUrl,
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Parse command line arguments
 * @returns {{baseUrl: string, help: boolean, verbose: boolean, spa: boolean}}
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    baseUrl: 'https://tooljump.dev',
    help: false,
    verbose: false,
    spa: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-h' || arg === '--help') {
      result.help = true;
    } else if (arg === '-u' || arg === '--url') {
      if (i + 1 < args.length) {
        result.baseUrl = args[i + 1];
        i++; // Skip next argument
      } else {
        console.error('Error: --url requires a value');
        process.exit(1);
      }
    } else if (arg === '-v' || arg === '--verbose') {
      result.verbose = true;
    } else if (arg === '-s' || arg === '--spa') {
      result.spa = true;
    } else if (!arg.startsWith('-')) {
      // Assume first non-flag argument is the URL
      result.baseUrl = arg;
    }
  }
  
  return result;
}

/**
 * Print usage help
 */
function printHelp() {
  console.log(`
Usage: test-links.js [OPTIONS] [URL]

Test all URLs in the project matching a base URL to ensure they're accessible.

Options:
  -u, --url URL     Base URL to search for (default: https://tooljump.dev)
  -v, --verbose     Show verbose output with status for each URL
  -s, --spa         Use headless browser for SPA (requires puppeteer)
  -h, --help        Show this help message

Examples:
  node test-links.js
  node test-links.js http://localhost:3000
  node test-links.js --url https://example.com
  node test-links.js --verbose
  node test-links.js --spa --verbose

Notes:
  - SPA mode requires puppeteer: npm install puppeteer
  - SPA mode is slower but detects 404s in Single Page Applications
  `);
}

/**
 * Main function
 */
async function main() {
  const { baseUrl, help, verbose, spa } = parseArgs();
  
  if (help) {
    printHelp();
    process.exit(0);
  }
  
  // Check if SPA mode is requested but puppeteer is not available
  if (spa && !puppeteer) {
    console.error('Error: --spa mode requires puppeteer');
    console.error('Install it with: npm install puppeteer');
    process.exit(1);
  }
  
  console.log(`🔍 Searching for ${baseUrl} URLs...${spa ? ' (SPA mode)' : ''}\n`);
  
  // Search for URLs
  const grepOutput = searchForUrls(baseUrl);
  
  if (!grepOutput.trim()) {
    console.log(`No ${baseUrl} URLs found in the project.`);
    process.exit(0);
  }
  
  // Extract unique URLs
  const urls = extractUrls(grepOutput, baseUrl);
  
  if (urls.size === 0) {
    console.log(`No valid ${baseUrl} URLs found in the project.`);
    process.exit(0);
  }
  
  console.log(`Found ${urls.size} unique URL(s) to test.\n`);
  
  // Test each URL
  const results = [];
  let browser = null;
  
  try {
    // Launch browser if in SPA mode
    if (spa) {
      browser = await puppeteer.launch({ headless: 'new' });
    }
    
    for (const urlToTest of urls) {
      const result = spa 
        ? await testUrlSPA(urlToTest, browser, verbose)
        : await testUrl(urlToTest, verbose);
      results.push(result);
    }
  } finally {
    // Close browser if it was opened
    if (browser) {
      await browser.close();
    }
  }
  
  if (verbose) {
    console.log(''); // Empty line after verbose output
  }
  
  // Filter and report only errors
  const errors = results.filter(r => !r.ok);
  
  if (errors.length === 0) {
    console.log('✅ All URLs are accessible!\n');
    process.exit(0);
  } else {
    console.log('❌ Errors found:\n');
    
    for (const error of errors) {
      if (error.error) {
        console.log(`  ✗ ${error.url}`);
        console.log(`    Error: ${error.error}\n`);
      } else if (error.status === 404) {
        console.log(`  ✗ ${error.url}`);
        console.log(`    Status: 404 Not Found\n`);
      } else if (error.status >= 400) {
        console.log(`  ✗ ${error.url}`);
        console.log(`    Status: ${error.status}\n`);
      } else {
        console.log(`  ✗ ${error.url}`);
        console.log(`    Unexpected error\n`);
      }
    }
    
    console.log(`Failed: ${errors.length}/${results.length} URLs\n`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { extractUrls, testUrl, testUrlSPA, searchForUrls, parseArgs };

