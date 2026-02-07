# Analytics Tab Template Data Structure

This template expects the following data context from `NarratorPanel.getData()`:

```javascript
{
  // API Configuration
  apiKeyConfigured: boolean,
  
  // i18n strings
  i18n: {
    currentSession: string,
    endSession: string,
    totalDuration: string,
    speakerCount: string,
    speakingTime: string,
    segments: string,
    noSpeakersYet: string,
    noActiveSession: string,
    startRecording: string,
    timeline: string,
    noTimelineData: string,
    sessionHistory: string,
    clearHistory: string,
    speakers: string,
    viewDetails: string,
    exportSession: string,
    deleteSession: string,
    noSessionHistory: string
  },
  
  // Current Session Data
  hasCurrentSession: boolean,
  currentSession: {
    duration: string,        // e.g., "1h 23m"
    speakerCount: number,
    speakers: [
      {
        name: string,
        formattedTime: string,  // e.g., "15m 30s"
        percentage: number,     // 0-100
        segmentCount: number
      }
    ]
  },
  
  hasSpeakers: boolean,
  
  // Timeline Data
  hasTimelineData: boolean,
  timeline: [
    {
      timestamp: number,
      heightPercent: number,    // 0-100 (relative to max bucket)
      label: string,            // Tooltip text
      timeLabel: string,        // e.g., "0:00", "5:00"
      speakerBars: [
        {
          heightPercent: number,
          color: string,        // CSS color
          speakerName: string,
          duration: number      // seconds
        }
      ]
    }
  ],
  
  speakers: [  // For legend
    {
      name: string,
      color: string
    }
  ],
  
  // Session History
  hasHistory: boolean,
  sessionHistory: [
    {
      sessionId: string,
      formattedDate: string,    // e.g., "2026-02-07 14:30"
      duration: string,         // e.g., "45m"
      speakerCount: number,
      dominantSpeaker: string   // Optional
    }
  ]
}
```

## CSS Classes Used

- `.analytics-tab-container` - Main container
- `.analytics-section` - Section wrapper
- `.current-session`, `.session-timeline`, `.session-history` - Section-specific classes
- `.section-header` - Section header with title and actions
- `.session-summary` - Summary stats container
- `.summary-stats`, `.stat-item` - Statistics display
- `.speaker-stats`, `.speaker-list`, `.speaker-item` - Speaker list components
- `.speaking-time-bar-container`, `.speaking-time-bar` - Progress bar
- `.timeline-visualization`, `.timeline-bars`, `.timeline-bucket` - Timeline visualization
- `.timeline-legend`, `.legend-item`, `.legend-color` - Timeline legend
- `.session-history-list`, `.history-item` - History list components
- `.empty-state` - Empty state placeholder

## Event Handlers (to be implemented in ui-panel.js)

- `.end-session` - End current session
- `.start-session` - Start new session
- `.clear-history` - Clear all session history
- `.view-session` - View session details
- `.export-session` - Export session data
- `.delete-session` - Delete specific session
