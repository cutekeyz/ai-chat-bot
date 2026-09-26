PROJECT STRUCTURE!!!

┌──────────────────────┐
│       FRONTEND       │
│        React         │
│                      │
│  [ Hello, AI!     ]  │
│  [ Send           ]  │
└──────────┬───────────┘
           │
           │ HTTP POST
           │
           ▼
┌──────────────────────┐
│       BACKEND        │
│     Node + Express   │
│                      │
│   /api/chat          │
└──────────┬───────────┘
           │
           │ API request
           ▼
┌──────────────────────┐
│       LLM API        │
│                      │
│      AI Model        │
└──────────┬───────────┘
           │
           │ response
           ▼
        Backend
           │
           │ JSON
           ▼
        React