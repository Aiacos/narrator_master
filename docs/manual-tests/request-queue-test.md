# Manual Test: Request Queue FIFO Processing

## Test Objective

Verify that the OpenAI API services correctly queue multiple concurrent requests and process them sequentially in FIFO (First-In-First-Out) order, with support for priority-based processing and queue size monitoring.

## Prerequisites

1. Foundry VTT running with Narrator Master module enabled
2. Valid OpenAI API key configured
3. Browser developer console open (F12)
4. GM user logged in

## Test Setup

### Browser Console Helper Functions

Use this browser console script to help track request ordering and queue size:

```javascript
// Tracking variables
window._queueTestLog = [];
window._requestCounter = 0;

// Helper function to log queue state
window.logQueueState = function() {
    if (window.narratorMaster?.transcriptionService) {
        const queueSize = window.narratorMaster.transcriptionService.getQueueSize();
        console.log(`[QUEUE TEST] Current queue size: ${queueSize}`);
        return queueSize;
    }
    return 0;
};

// Helper function to add slow delay to operations (for testing visibility)
window._originalFetch = window.fetch;
window.fetch = async function(url, options) {
    if (url.includes('api.openai.com')) {
        const requestId = ++window._requestCounter;
        const timestamp = new Date().toISOString().slice(11, 23);

        console.log(`[QUEUE TEST ${requestId}] Request started at ${timestamp}`);
        window._queueTestLog.push({
            id: requestId,
            started: timestamp,
            url: url.split('/').pop()
        });

        // Add artificial delay to make queue processing visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await window._originalFetch.apply(this, arguments);

        const endTimestamp = new Date().toISOString().slice(11, 23);
        console.log(`[QUEUE TEST ${requestId}] Request completed at ${endTimestamp}`);
        window._queueTestLog[requestId - 1].completed = endTimestamp;

        return result;
    }

    return window._originalFetch.apply(this, arguments);
};

console.log('[QUEUE TEST] Tracking helpers installed.');
console.log('[QUEUE TEST] Use logQueueState() to check current queue size.');
```

## Test Procedure

### Test 1: Basic FIFO Queue Processing

**Objective:** Verify that multiple requests are processed sequentially in FIFO order.

1. **Install tracking helper** (run the setup script in browser console)

2. **Prepare for rapid requests:**
   - Open the Narrator Master panel
   - Prepare to trigger multiple transcription requests rapidly

3. **Trigger 5 rapid transcription requests:**
   - Method A (Recommended): Use browser console to simulate multiple requests:
     ```javascript
     // Create 5 rapid transcription requests
     const blob = new Blob(['Test audio'], { type: 'audio/webm' });

     for (let i = 1; i <= 5; i++) {
         setTimeout(() => {
             console.log(`[TEST] Triggering request ${i}/5`);
             window.narratorMaster.transcriptionService.transcribe(blob)
                 .then(() => console.log(`[TEST] Request ${i} completed successfully`))
                 .catch(err => console.error(`[TEST] Request ${i} failed:`, err));

             // Log queue size after each trigger
             setTimeout(() => window.logQueueState(), 50);
         }, i * 100); // Stagger by 100ms to ensure order
     }
     ```

   - Method B (Manual): Rapidly record and stop 5 times in the UI

4. **Observe console output** - You should see:
   ```
   [TEST] Triggering request 1/5
   [QUEUE TEST] Current queue size: 1
   [TEST] Triggering request 2/5
   [QUEUE TEST] Current queue size: 2
   [TEST] Triggering request 3/5
   [QUEUE TEST] Current queue size: 3
   [TEST] Triggering request 4/5
   [QUEUE TEST] Current queue size: 4
   [TEST] Triggering request 5/5
   [QUEUE TEST] Current queue size: 5

   [QUEUE TEST 1] Request started at 12:34:56.100
   [QUEUE TEST] Current queue size: 4
   [QUEUE TEST 1] Request completed at 12:34:57.150
   [TEST] Request 1 completed successfully

   [QUEUE TEST 2] Request started at 12:34:57.150
   [QUEUE TEST] Current queue size: 3
   [QUEUE TEST 2] Request completed at 12:34:58.200
   [TEST] Request 2 completed successfully

   [QUEUE TEST 3] Request started at 12:34:58.200
   [QUEUE TEST] Current queue size: 2
   [QUEUE TEST 3] Request completed at 12:34:59.250
   [TEST] Request 3 completed successfully

   [QUEUE TEST 4] Request started at 12:34:59.250
   [QUEUE TEST] Current queue size: 1
   [QUEUE TEST 4] Request completed at 12:35:00.300
   [TEST] Request 4 completed successfully

   [QUEUE TEST 5] Request started at 12:35:00.300
   [QUEUE TEST] Current queue size: 0
   [QUEUE TEST 5] Request completed at 12:35:01.350
   [TEST] Request 5 completed successfully
   ```

5. **Verify FIFO ordering:**
   ```javascript
   // Check request execution order
   console.table(window._queueTestLog);
   ```
   - Requests should complete in order: 1, 2, 3, 4, 5
   - Each request should start AFTER the previous one completes
   - Queue size should decrease from 5 → 4 → 3 → 2 → 1 → 0

6. **Cleanup:**
   ```javascript
   window._queueTestLog = [];
   window._requestCounter = 0;
   ```

### Test 2: Queue Size Monitoring

**Objective:** Verify that `getQueueSize()` accurately reports the number of pending requests.

1. **Monitor queue size in real-time:**
   ```javascript
   // Start monitoring queue size every 100ms
   window._queueMonitor = setInterval(() => {
       const size = window.logQueueState();
       if (size === 0) {
           console.log('[QUEUE TEST] Queue is empty, stopping monitor');
           clearInterval(window._queueMonitor);
       }
   }, 100);

   // Trigger 3 requests
   const blob = new Blob(['Test audio'], { type: 'audio/webm' });
   for (let i = 1; i <= 3; i++) {
       window.narratorMaster.transcriptionService.transcribe(blob);
   }
   ```

2. **Expected output:**
   - Queue size should start at 3
   - Queue size should decrease by 1 as each request completes
   - Queue size should reach 0 when all requests are processed

3. **Cleanup:**
   ```javascript
   clearInterval(window._queueMonitor);
   ```

### Test 3: Priority Queue Ordering

**Objective:** Verify that high-priority requests are processed before low-priority requests.

**Note:** This test requires direct access to `_enqueueRequest()` method. If the public API doesn't expose priority, this test can be skipped or performed via code modification.

1. **Queue requests with different priorities:**
   ```javascript
   // Access the transcription service
   const service = window.narratorMaster.transcriptionService;

   // Create test operations
   const createTestOp = (id, delay = 100) => async () => {
       console.log(`[PRIORITY TEST] Operation ${id} executing`);
       await new Promise(resolve => setTimeout(resolve, delay));
       return id;
   };

   // Queue with different priorities (higher number = higher priority)
   const p1 = service._enqueueRequest(createTestOp('Low-1'), {}, 0);
   const p2 = service._enqueueRequest(createTestOp('Low-2'), {}, 0);
   const p3 = service._enqueueRequest(createTestOp('High-1'), {}, 10);
   const p4 = service._enqueueRequest(createTestOp('Low-3'), {}, 0);
   const p5 = service._enqueueRequest(createTestOp('High-2'), {}, 10);

   Promise.all([p1, p2, p3, p4, p5])
       .then(results => console.log('[PRIORITY TEST] Execution order:', results));
   ```

2. **Expected execution order:**
   - If queue was empty when requests added:
     - Order: Low-1 (already processing), High-1, High-2, Low-2, Low-3
   - High-priority requests (10) should execute before remaining low-priority (0)
   - Among same priority, FIFO order is maintained

3. **Expected console output:**
   ```
   [PRIORITY TEST] Operation Low-1 executing
   [PRIORITY TEST] Operation High-1 executing
   [PRIORITY TEST] Operation High-2 executing
   [PRIORITY TEST] Operation Low-2 executing
   [PRIORITY TEST] Operation Low-3 executing
   [PRIORITY TEST] Execution order: ['Low-1', 'High-1', 'High-2', 'Low-2', 'Low-3']
   ```

### Test 4: Queue Limit (maxQueueSize)

**Objective:** Verify that the queue rejects new requests when full.

1. **Check current queue limit:**
   ```javascript
   // Default limit is 100, check via settings
   const service = window.narratorMaster.transcriptionService;
   console.log('[QUEUE TEST] Max queue size:', service._maxQueueSize);
   ```

2. **Fill the queue to capacity:**
   ```javascript
   // Create operation that takes a long time
   const slowOp = async () => {
       await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
       return 'done';
   };

   const service = window.narratorMaster.transcriptionService;
   const maxSize = service._maxQueueSize;
   const promises = [];

   try {
       // Queue up to max capacity
       for (let i = 0; i < maxSize; i++) {
           promises.push(service._enqueueRequest(slowOp, { id: i }));
       }

       console.log(`[QUEUE TEST] Successfully queued ${maxSize} requests`);
       console.log('[QUEUE TEST] Queue size:', service.getQueueSize());

       // Try to add one more (should fail)
       try {
           service._enqueueRequest(slowOp, { id: 'overflow' });
           console.error('[QUEUE TEST] FAIL - Should have thrown queue full error');
       } catch (error) {
           console.log('[QUEUE TEST] PASS - Queue full error:', error.message);
       }

   } finally {
       // Clean up by clearing queue
       service.clearQueue();
       console.log('[QUEUE TEST] Queue cleared');
   }
   ```

3. **Expected output:**
   ```
   [QUEUE TEST] Successfully queued 100 requests
   [QUEUE TEST] Queue size: 100
   [QUEUE TEST] PASS - Queue full error: Request queue full (100 requests). Try again later.
   [QUEUE TEST] Queue cleared
   ```

### Test 5: Queue Clearing

**Objective:** Verify that `clearQueue()` cancels all pending requests.

1. **Queue multiple requests and clear:**
   ```javascript
   const service = window.narratorMaster.transcriptionService;

   // Create operation with delay
   const delayedOp = async (id) => {
       console.log(`[CLEAR TEST] Operation ${id} started`);
       await new Promise(resolve => setTimeout(resolve, 5000));
       console.log(`[CLEAR TEST] Operation ${id} completed`);
       return id;
   };

   // Queue several requests
   const promises = [];
   for (let i = 1; i <= 5; i++) {
       promises.push(
           service._enqueueRequest(() => delayedOp(i), {})
               .then(result => console.log(`[CLEAR TEST] Promise ${i} resolved:`, result))
               .catch(err => console.log(`[CLEAR TEST] Promise ${i} rejected:`, err.message))
       );
   }

   // Check queue size
   console.log('[CLEAR TEST] Queue size before clear:', service.getQueueSize());

   // Wait a moment, then clear the queue
   setTimeout(() => {
       console.log('[CLEAR TEST] Clearing queue...');
       service.clearQueue();
       console.log('[CLEAR TEST] Queue size after clear:', service.getQueueSize());
   }, 1500);
   ```

2. **Expected output:**
   ```
   [CLEAR TEST] Queue size before clear: 5
   [CLEAR TEST] Operation 1 started
   (... 1.5 seconds pass ...)
   [CLEAR TEST] Clearing queue...
   narrator-master] Cleared 4 pending request(s) from queue
   [CLEAR TEST] Queue size after clear: 0
   [CLEAR TEST] Promise 2 rejected: Request cancelled: queue cleared
   [CLEAR TEST] Promise 3 rejected: Request cancelled: queue cleared
   [CLEAR TEST] Promise 4 rejected: Request cancelled: queue cleared
   [CLEAR TEST] Promise 5 rejected: Request cancelled: queue cleared
   (... later ...)
   [CLEAR TEST] Operation 1 completed
   [CLEAR TEST] Promise 1 resolved: 1
   ```

3. **Verify:**
   - First request completes (already processing)
   - Remaining 4 requests are cancelled with "queue cleared" error
   - Queue size becomes 0 after clear
   - Cancelled promises reject with `isCancelled` flag

### Test 6: Cross-Service Queue Independence

**Objective:** Verify that each service has its own independent queue.

1. **Queue requests on multiple services simultaneously:**
   ```javascript
   const transcription = window.narratorMaster.transcriptionService;
   const aiAssistant = window.narratorMaster.aiAssistant;
   const imageGen = window.narratorMaster.imageGenerator;

   // Create test operation
   const testOp = (service, id) => async () => {
       console.log(`[INDEPENDENCE TEST] ${service} operation ${id} executing`);
       await new Promise(resolve => setTimeout(resolve, 500));
       return `${service}-${id}`;
   };

   // Queue on transcription service
   transcription._enqueueRequest(testOp('Transcription', 1), {});
   transcription._enqueueRequest(testOp('Transcription', 2), {});

   // Queue on AI assistant service
   aiAssistant._enqueueRequest(testOp('AIAssistant', 1), {});
   aiAssistant._enqueueRequest(testOp('AIAssistant', 2), {});

   // Queue on image generator service
   imageGen._enqueueRequest(testOp('ImageGen', 1), {});
   imageGen._enqueueRequest(testOp('ImageGen', 2), {});

   // Check queue sizes
   console.log('[INDEPENDENCE TEST] Transcription queue:', transcription.getQueueSize());
   console.log('[INDEPENDENCE TEST] AI Assistant queue:', aiAssistant.getQueueSize());
   console.log('[INDEPENDENCE TEST] Image Generator queue:', imageGen.getQueueSize());
   ```

2. **Expected output:**
   ```
   [INDEPENDENCE TEST] Transcription queue: 2
   [INDEPENDENCE TEST] AI Assistant queue: 2
   [INDEPENDENCE TEST] Image Generator queue: 2

   [INDEPENDENCE TEST] Transcription operation 1 executing
   [INDEPENDENCE TEST] AIAssistant operation 1 executing
   [INDEPENDENCE TEST] ImageGen operation 1 executing
   (... operations execute in parallel on different services ...)
   ```

3. **Verify:**
   - Each service maintains its own queue
   - Queues process independently (in parallel)
   - Clearing one queue doesn't affect others

## Cleanup

After all tests, restore normal operation:

```javascript
// Restore original fetch
if (window._originalFetch) {
    window.fetch = window._originalFetch;
    delete window._originalFetch;
}

// Clear test variables
delete window._queueTestLog;
delete window._requestCounter;
delete window.logQueueState;

// Clear any monitoring intervals
if (window._queueMonitor) {
    clearInterval(window._queueMonitor);
    delete window._queueMonitor;
}

console.log('[QUEUE TEST] Cleanup complete. Normal operation restored.');
```

## Expected Results

### ✅ Pass Criteria

1. **FIFO Ordering:**
   - Requests are processed in the order they were queued (for same priority)
   - No request starts before the previous one completes
   - Request IDs in console log show sequential execution

2. **Queue Size Monitoring:**
   - `getQueueSize()` returns accurate count of pending requests
   - Queue size decreases as requests are processed
   - Queue size is 0 when all requests complete

3. **Priority Ordering:**
   - High-priority requests execute before low-priority requests
   - Among same priority, FIFO order is maintained
   - Currently processing request is not affected by new high-priority requests

4. **Queue Limit:**
   - Queue accepts requests up to `maxQueueSize`
   - Attempts to queue beyond limit throw an error
   - Error message indicates queue is full

5. **Queue Clearing:**
   - `clearQueue()` cancels all pending requests
   - Cancelled requests reject with "queue cleared" error
   - Currently processing request completes normally
   - Queue size becomes 0 after clear
   - Console shows count of cleared requests

6. **Service Independence:**
   - Each service has its own queue
   - Queues process independently
   - Queue operations on one service don't affect others

### ❌ Fail Criteria

1. Requests execute out of order (FIFO violation)
2. Multiple requests execute simultaneously (concurrency control failure)
3. `getQueueSize()` returns incorrect count
4. Queue accepts more requests than `maxQueueSize`
5. `clearQueue()` doesn't cancel pending requests
6. Queues are shared across services
7. Console errors or unhandled promise rejections

## Troubleshooting

### Issue: Requests execute in parallel (not sequentially)

**Cause:** Queue processing logic not working correctly

**Solution:** Check that `_isProcessingQueue` flag is functioning and `_processQueue()` uses `await` for sequential execution

### Issue: Queue size always shows 0

**Cause:** Requests might be executing immediately instead of queuing

**Solution:** Ensure operations have some delay (use the fetch override to add artificial delay)

### Issue: Can't access `_enqueueRequest()` in console

**Cause:** Private method not exposed publicly

**Solution:** Access via service instance: `window.narratorMaster.transcriptionService._enqueueRequest()`

### Issue: Priority test doesn't show priority ordering

**Cause:** First request already processed before high-priority requests added

**Solution:** Add delay before queueing high-priority requests, or use slow operations

## Test Results Template

```
Test Date: _______________
Tester: _______________
Foundry Version: _______________
Module Version: _______________

Test 1 (FIFO Ordering): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 2 (Queue Size Monitoring): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 3 (Priority Ordering): [ ] PASS [ ] FAIL [ ] SKIPPED
Notes: _______________________________________________

Test 4 (Queue Limit): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 5 (Queue Clearing): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Test 6 (Service Independence): [ ] PASS [ ] FAIL
Notes: _______________________________________________

Overall: [ ] PASS [ ] FAIL
```

## Notes

- This test validates the request queue implementation in `OpenAIServiceBase`
- All three API services (TranscriptionService, AIAssistant, ImageGenerator) inherit queue behavior
- Queue processing is sequential (one request at a time) to prevent API rate limiting
- The queue automatically integrates with retry logic for error handling
- Console logging is essential for verifying queue behavior during development
- For production use, queue operates transparently - users don't see queue mechanics
