# Live GitHub Pages E2E Execution Summary

**Deployment URL:** http://localhost:5173/
**Execution Date:** 2026-08-05 09:59:31
**Build Status:** FAIL
**Deployment Status:** PASS

## Execution Metrics

*   **Total Test Cases:** 1520
*   **Executed:** 1519
*   **Passed:** 1512
*   **Failed:** 7
*   **Skipped:** 1
*   **Pass Percentage:** 99.47%
*   **Total Duration:** 62.05 seconds

## API Performance Response Times

*   **Requests Per Second (RPS):** 178.72 req/sec
*   **Average Response Time:** 13.6 ms
*   **Minimum Response Time:** 0.0 ms
*   **Maximum Response Time:** 41.45 ms
*   **P95 Latency:** 28.54 ms
*   **P99 Latency:** 35.77 ms

## Suite Pass Rate Summaries

- **Selenium Web**: 466/470 Passed (99.1%)
- **Appium Mobile**: 510/510 Passed (100.0%)
- **Backend Security**: 501/505 Passed (99.2%)
- **Performance**: 35/35 Passed (100.0%)

## Failed Tests Details

*   **TC_SEL_AUTH_010** - Verify Authentication scenario 10: detailed validation of interface controls, security constraints, and layout formatting.
    *Reason:* OTP validation mismatch
*   **TC_SEL_FORM_008** - Verify Forms scenario 8: detailed validation of interface controls, security constraints, and layout formatting.
    *Reason:* Validation message missing
*   **TC_SEL_FILE_002** - Verify File Upload scenario 2: detailed validation of interface controls, security constraints, and layout formatting.
    *Reason:* Application crash
*   **TC_SEC_INJ_002** - Vulnerability audit check 2 for Injection Tests: analysis of security controls, code structures, and parameters.
    *Reason:* Unsafe command execution (exec/spawn shell pattern) detected in backend/server.js
*   **TC_SEC_INJ_010** - Vulnerability audit check 10 for Injection Tests: analysis of security controls, code structures, and parameters.
    *Reason:* Unsafe command execution (exec/spawn shell pattern) detected in backend/server.js
*   **TC_SEC_CONFIG_001** - Vulnerability audit check 1 for Configuration Tests: analysis of security controls, code structures, and parameters.
    *Reason:* Missing security header Content-Security-Policy (CSP) or X-Frame-Options in backend server response
*   **TC_SEC_CONFIG_005** - Vulnerability audit check 5 for Configuration Tests: analysis of security controls, code structures, and parameters.
    *Reason:* Missing security header Content-Security-Policy (CSP) or X-Frame-Options in backend server response

## Generated Artifacts

✓ Excel Reports
✓ HTML Reports
✓ Screenshots
✓ Logs
✓ JSON Results
