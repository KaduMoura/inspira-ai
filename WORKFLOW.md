# WORKFLOW.md

## 1. System Overview
Inspira AI is a specialized AI-powered visual search engine designed to find furniture and design products that match a user's uploaded image and intent. Unlike traditional keyword search, Inspira AI employs a multi-stage AI pipeline to "see" the input image, understand its aesthetic and physical attributes (style, material, shape), and retrieve the most relevant items from a curated catalog.

The system acts as an intelligent matchmaker between visual inspiration and a structured product database, utilizing advanced Large Language Models (LLMs) for both vision analysis and semantic reranking.

## 2. Main User Flow (Image Search Journey)
The logical progression of a user interacting with the system:

1.  **User enters homepage**: The user is presented with a clean, search-focused interface.
2.  **User Configuration (One-time)**: The user clicks "Activate API Key" to open a settings modal and securely inputs their Gemini API Key. This key is stored locally in the browser/session state and used for subsequent requests.
3.  **User uploads image**: The user drags and drops or selects a reference image (e.g., a photo of a chair they like).
4.  **User optionally enters text query**: The user can add context (e.g., "Find this but in green velvet").
5.  **User clicks "Find Matches"**: The frontend initiates the search process.
6.  **Frontend behavior**:
    *   Validates API Key presence.
    *   Compresses/optimizes the image.
    *   Sends a multipart request to the backend with the image, prompt, and `x-ai-api-key` header.
7.  **Backend receives request**: The API Gateway (Fastify) validates:
    *   Presence of `x-ai-api-key` header.
    *   Image file format (Magic Bytes check) and dimensions (sharp).
    *   Multipart structure.
8.  **AI Stage 1 (Vision Understanding)**: The system sends the image to a Vision LLM (Gemini 2.5 Flash). The model analyze visual content and extracts structured signals.
9.  **Candidate Retrieval Strategy**: Using extracted signals, the backend constructs a query plan to fetch candidates from MongoDB.
10. **AI Stage 2 (LLM Re-ranking)**: Top heuristic matches are re-ranked by a second Reasoning LLM (Gemini 3 Flash Preview) based on visual/semantic similarity.
11. **Final Response Shaping**: Results are returned with metadata.
12. **Frontend Rendering**: Results are displayed in a grid.
13. **User Feedback**: User can click "Thumbs Up/Down" on the search result explanation to provide feedback, which is sent asynchronously to the backend.

## 3. Backend Processing Pipeline (Macro Architecture)
The backend is structured as a modular pipeline orchestrated by the `ImageSearchService`:

*   **API Layer (Fastify)**: Handles HTTP requests, rate limiting (100 req/min), file size limits, and `x-ai-api-key` header validation.
*   **Orchestration (Service Layer)**: `ImageSearchService` coordinates the async flow.
*   **AI Integration**: Dedicated services (`GeminiVisionSignalExtractor`, `GeminiCatalogReranker`) encapsulate LLM interactions. The User's API Key is passed through to the LLM provider; the backend does not store it.
*   **Data Access (Repository)**: `CatalogRepository` interacts with MongoDB (Read-Only).
*   **Heuristic Scoring**: Local scoring algorithm based on price, dimensions, and keyword overlap.
*   **Telemetry & Observability**:
    *   **Ring Buffer**: An in-memory buffer stores the last 50 requests with full timing and failure details.
    *   **Feedback Loop**: User feedback is attached to these in-memory events for real-time inspection via the Admin Panel.
    *   **Logs**: Structured logs are emitted for persistent debugging.

## 4. AI Pipeline (Two-Stage Strategy)
Great results come from separating "Search" and "Reasoning":

### Stage 1: Vision + Attribute Extraction
*   **Input**: User Image + Optional User Prompt.
*   **Model**: High-speed Vision Model (e.g., Gemini 2.5 Flash).
*   **Output**: Structured JSON containing `category`, `product_type`, `visual_attributes` (material, shape, style), and `search_keywords`.

### Stage 2: Catalog-aware Re-ranking
*   **Input**: User Image + List of Top-N Candidates (JSON data) + User Prompt.
*   **Model**: High-reasoning Model (e.g., Gemini 3 Flash Preview).
*   **Output**: A re-ordered list of IDs and specific reasons for the ranking.

## 5. Ranking Strategy
The final rank is determined by a funnel approach:

1.  **Database Retrieval (Broad)**: Filters by Category/Type.
2.  **Heuristic Scoring (Fast)**: Math-based sort.
3.  **LLM Re-ranking (Smart)**: AI-based sort (Top-M items).
4.  **Final Sort**: AI Rank > Heuristic Rank.

## 6. Admin Panel Workflow
The request also supports an Admin Panel (`/admin`) for system tuning:

*   **Authentication**: Admin requests require an `x-admin-token` header.
*   **Telemetry Inspection**: Admins can view the "Live Telemetry" (recent 50 requests).
*   **Configuration**: Dynamic tuning of weights, candidate sizes, and prompts without redeploying.

## 7. Data Flow Diagram (Textual)

```mermaid
graph LR
    User -->|Set API Key| Frontend
    Frontend -->|POST /search (w/ Key)| API_Gateway
    API_Gateway --> Orchestrator
    Orchestrator -->|Key + Image| Vision_Model
    Vision_Model -->|Signals| Orchestrator
    Orchestrator -->|Signals| MongoDB
    MongoDB -->|Candidates| Orchestrator
    Orchestrator -->|Key + Candidates| Reranker_Model
    Reranker_Model -->|Ranked IDs| Orchestrator
    Orchestrator -->|Results| API_Gateway
    API_Gateway -->|Results| Frontend
    Frontend -->|Wait...| User
    User -->|Feedback| Frontend
    Frontend -->|POST /feedback| API_Gateway
    API_Gateway -->|Update Event| Telemetry_Buffer
```

## 8. Failure Scenarios
Robustness is key to user experience:

*   **Invalid API Key**: Backend returns 401. Frontend prompts user to fix key.
*   **Image Analysis Fails**: Check if User Prompt exists. If yes, fallback to text search.
*   **LLM Reranking Fails**: Log error and return Heuristic order.
*   **JSON Repair**: "Repair" LLM call attempts to fix broken JSON.
*   **Telemetry Buffer Full**: Oldest event is dropped (Ring Buffer).

## 9. Non-Goals
*   **E-commerce**: This system does not handle cart, checkout, or payments.
*   **Persistent User History**: Search history is ephemeral or strictly log-based.
