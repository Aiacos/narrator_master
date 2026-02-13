# Manual Test: Rate Limit (429) Retry with Exponential Backoff

## Test Objective

Verify that the OpenAI API services automatically retry requests when encountering HTTP 429 (Rate Limited) responses, using exponential backoff with jitter.

## Prerequisites

1. Foundry VTT running with Narrator Master module enabled
2. Valid OpenAI API key configured
3. Browser developer console open (F12)
4. GM user logged in

## Test Setup

### Option 1: Mock 429 Response (Recommended for Testing)

Use this browser console script to temporarily override the fetch function and simulate a 429 response:

```javascript
// Save original fetch
window._originalFetch = window.fetch;

// Counter for tracking retry attempts
let attemptCount = 0;
const maxFailures = 2; // Fail first 2 attempts, succeed on 3rd

// Override fetch to simulate 429 responses
window.fetch = async function(url, options) {
    // Only intercept OpenAI API calls
    if (url.includes('api.openai.com')) {
        attemptCount++;

        console.log(`[TEST] OpenAI API call attempt #${attemptCount}`);

        // Simulate 429 for first N attempts
        if (attemptCount <= maxFailures) {
            console.log(`[TEST] Simulating 429 Rate Limit (attempt ${attemptCount}/${maxFailures})`);

            // Create a mock 429 response
            return Promise.resolve(new Response(
                JSON.stringify({
                    error: {
                        message: 'Rate limit exceeded. Please retry after some time.',
                        type: 'rate_limit_error',
                        code: 'rate_limit_exceeded'
                    }
                }),
                {
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        'Retry-After': '2' // Suggest 2 second retry
                    })
                }
            ));
        }

        console.log(`[TEST] Allowing request through (attempt ${attemptCount})`);
    }

    // Call original fetch for this request
    return window._originalFetch.apply(this, arguments);
};

console.log('[TEST] Fetch override installed. First 2 OpenAI API calls will return 429.');
console.log('[TEST] Trigger a transcription or AI analysis to test retry behavior.');
```

### Option 2: Use OpenAI API Rate Limiting (Real-World Test)

If you want to test with real rate limiting:

1. Set very low retry delays for faster testing:
   - Go to Module Settings → Narrator Master
   - Set "API Retry Base Delay" to 500ms
   - Set "API Retry Max Attempts" to 3
2. Rapidly trigger multiple transcriptions to intentionally hit rate limits

## Test Procedure

### Test 1: Transcription Service Retry

1. **Install the mock** (run the Option 1 script in browser console)

2. **Trigger a transcription:**
   - Open the Narrator Master panel
   - Click "Start Recording"
   - Speak for a few seconds
   - Click "Stop Recording"

3. **Observe console output** - You should see:
   ```
   [TEST] OpenAI API call attempt #1
   [TEST] Simulating 429 Rate Limit (attempt 1/2)
   [narrator-master] Transcription Service failed (attempt 1/3), retrying in ~1250ms: Rate limited. Try again later.

   [TEST] OpenAI API call attempt #2
   [TEST] Simulating 429 Rate Limit (attempt 2/2)
   [narrator-master] Transcription Service failed (attempt 2/3), retrying in ~2500ms: Rate limited. Try again later.

   [TEST] OpenAI API call attempt #3
   [TEST] Allowing request through (attempt 3)
   [narrator-master] Transcription Service succeeded after 3 attempts
   ```

4. **Verify exponential backoff:**
   - First retry: ~1000-1250ms delay
   - Second retry: ~2000-2500ms delay
   - Third attempt: succeeds

5. **Check UI notification:**
   - Should show success notification after retries complete
   - Transcription should appear in the panel

6. **Restore fetch:**
   ```javascript
   window.fetch = window._originalFetch;
   attemptCount = 0;
   console.log('[TEST] Fetch override removed. Normal operation restored.');
   ```

### Test 2: AI Assistant Retry

1. **Install the mock** (run the Option 1 script again)

2. **Trigger AI analysis:**
   - Ensure you have a transcription with content
   - Click "Analyze Context" or wait for automatic analysis

3. **Observe console output** - Similar to Test 1, should show:
   - Multiple retry attempts
   - Exponential backoff delays
   - Eventual success message

4. **Restore fetch:**
   ```javascript
   window.fetch = window._originalFetch;
   attemptCount = 0;
   ```

### Test 3: Image Generator Retry

1. **Install the mock** (run the Option 1 script again)

2. **Trigger image generation:**
   - Switch to the "Images" tab in Narrator Master panel
   - Enter a description (e.g., "A fantasy tavern")
   - Click "Generate Image"

3. **Observe console output** - Should show retry behavior

4. **Restore fetch:**
   ```javascript
   window.fetch = window._originalFetch;
   attemptCount = 0;
   ```

## Expected Results

### ✅ Pass Criteria

1. **Retry Attempts:**
   - Service retries failed requests (should see multiple attempts)
   - Retry count matches configured max attempts (default: 3)

2. **Exponential Backoff:**
   - Delay increases exponentially between retries
   - First retry: ~1000-1250ms
   - Second retry: ~2000-2500ms
   - Third retry: ~4000-5000ms
   - Jitter adds 0-25% randomization

3. **Console Logging:**
   - Clear retry attempt messages logged
   - Shows attempt number (e.g., "attempt 1/3")
   - Shows retry delay in milliseconds
   - Shows error message for each failure

4. **Eventual Success:**
   - After retries, request eventually succeeds
   - Success message logged (e.g., "succeeded after 3 attempts")
   - UI updates with successful result

5. **User Experience:**
   - No error notification during retries (retries are automatic)
   - Success notification shown after completion
   - Data appears in UI (transcription, suggestions, or image)

### ❌ Fail Criteria

1. Request fails immediately without retrying
2. Retry delays are not exponential (constant or decreasing)
3. No console logging of retry attempts
4. Service gives up before max attempts
5. Error notification shown during automatic retries
6. Success not achieved after retries complete

## Test Variations

### Test 4: Verify Retry-After Header Handling

Modify the mock to include a longer Retry-After header:

```javascript
// In the mock, change the Retry-After header:
headers: new Headers({
    'Content-Type': 'application/json',
    'Retry-After': '5' // 5 seconds
})
```

**Expected:** The service should wait ~5 seconds before the first retry (overriding the exponential backoff for that attempt).

### Test 5: Verify Max Attempts Exceeded

Change `maxFailures` in the mock to exceed max retry attempts:

```javascript
const maxFailures = 5; // Fail 5 times (more than default 3 max attempts)
```

**Expected:**
- Service retries 3 times (default max)
- After 3rd failure, gives up
- Error notification shown to user
- Console shows: "failed after 3 attempts"

### Test 6: Verify Non-Retryable Errors

Modify the mock to return a 400 (Bad Request) instead of 429:

```javascript
status: 400,
statusText: 'Bad Request',
```

**Expected:**
- Service does NOT retry (400 is non-retryable)
- Error notification shown immediately
- Console shows: "failed with non-retryable error"

## Cleanup

After all tests, ensure the fetch override is removed:

```javascript
if (window._originalFetch) {
    window.fetch = window._originalFetch;
    delete window._originalFetch;
    console.log('[TEST] Fetch override removed. Normal operation restored.');
}
```

## Troubleshooting

### Issue: Console shows no retry attempts

**Cause:** Retry might be disabled in settings

**Solution:** Check Module Settings → Enable "API Retry Enabled"

### Issue: Retries happen instantly (no delay)

**Cause:** Retry base delay set to 0

**Solution:** Check Module Settings → Set "API Retry Base Delay" to at least 1000ms

### Issue: Mock not intercepting requests

**Cause:** Fetch override installed after service initialization

**Solution:** Reload Foundry and install mock BEFORE triggering any API calls

## Test Results Template

```
Test Date: _______________
Tester: _______________
Foundry Version: _______________
Module Version: _______________

Test 1 (Transcription Retry): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 2 (AI Assistant Retry): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 3 (Image Generator Retry): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 4 (Retry-After Header): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 5 (Max Attempts): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 6 (Non-Retryable): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Overall: [ ] PASS [ ] FAIL
```

## Notes

- This test validates the exponential backoff retry logic implemented in `OpenAIServiceBase`
- All three API services (TranscriptionService, AIAssistant, ImageGenerator) inherit this retry behavior
- The retry mechanism is transparent to users - they only see the final result
- Console logging is essential for debugging and verifying retry behavior during development
