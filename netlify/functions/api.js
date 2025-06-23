// netlify/functions/api.js

// Import necessary modules
const express = require('express');
const serverless = require('serverless-http'); // To wrap Express for Netlify Functions
const cors = require('cors'); // For Cross-Origin Resource Sharing

// Initialize the Express application
const app = express();

// --- Middleware ---

// 1. CORS Middleware:
// Enables Cross-Origin Resource Sharing for all origins.
// This is crucial for allowing your frontend (served from a different domain/port)
// to make requests to this backend function.
// In a production environment, it's highly recommended to restrict this to
// specific origins (e.g., your Netlify frontend domain) for enhanced security.
// Example for specific origin: app.use(cors({ origin: 'https://your-frontend-domain.netlify.app' }));
app.use(cors());

// 2. JSON Body Parser Middleware:
// Parses incoming request bodies with JSON payloads.
// This is essential for handling POST requests where the data (like our chat message)
// is sent in JSON format in the request body. It populates `req.body`.
app.use(express.json());

// --- API Endpoints ---

/**
 * Endpoint: Chat Message Exchange
 * Method: POST
 * Path: /chat (This is the internal path within the Netlify Function.
 *             It corresponds to /api/chat when accessed from the frontend
 *             due to the netlify.toml redirect configuration.)
 * Description: Accepts a user message and returns a simple echo response from the bot.
 *
 * Request Body (JSON Example):
 * { "message": "Hello bot, how are you?" }
 *
 * Response Body (JSON - Success: 200 OK Example):
 * { "response": "Echo: Hello bot, how are you?", "timestamp": "2023-10-27T10:30:00Z" }
 *
 * Response Body (JSON - Error: 400 Bad Request / 500 Internal Server Error Example):
 * { "error": "Message parameter is missing or empty." }
 */
app.post('/chat', (req, res) => {
    // Log the incoming request body for debugging purposes.
    // These logs will appear in your Netlify deployment logs.
    console.log('Received POST request to /chat (internal path):', req.body);

    // 1. Request Validation:
    // Check if the 'message' property exists in the request body and is a non-empty string.
    // This ensures that the essential data for the bot's response is provided and valid.
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
        console.error('Validation Error: Message parameter is missing or invalid.');
        // Respond with a 400 Bad Request status if the 'message' is not valid.
        return res.status(400).json({
            error: 'Message parameter is missing or empty.'
        });
    }

    // 2. Core Logic: Generate Bot's Response
    // As per the technical plan, the bot provides a simple echo response.
    // We prepend "Echo: " to the user's input message.
    const botResponse = `Echo: ${message}`;

    // 3. Prepare Response Payload:
    // Construct the JSON object that will be sent back to the frontend.
    // Include the bot's reply and a server-side timestamp for context, as specified.
    const responsePayload = {
        response: botResponse,
        timestamp: new Date().toISOString() // Generates timestamp in ISO 8601 format
    };

    // Log the successful response being sent for monitoring and debugging.
    console.log('Sending successful response:', responsePayload);

    // 4. Send Success Response:
    // Respond with a 200 OK status code, indicating success, and the JSON payload.
    res.status(200).json(responsePayload);
});

// --- General Error Handling Middleware ---
// This middleware is a catch-all for any unhandled errors that might occur
// during the processing of requests within the Express application.
// It ensures that even if an unexpected error happens, a consistent
// 500 Internal Server Error response is sent to the client.
app.use((err, req, res, next) => {
    console.error('Unhandled server error in Netlify Function:', err);
    res.status(500).json({
        error: 'An internal server error occurred.',
        // In a production environment, consider removing `err.message` from the
        // response for security reasons to avoid exposing sensitive server details.
        details: err.message
    });
});

// --- Netlify Function Export ---

// Export the Express application wrapped by `serverless-http`.
// This is the standard and recommended way to deploy an Express app
// as a serverless function on platforms like Netlify Functions.
// `serverless-http` adapts the Express request/response cycle to the
// Netlify Function handler signature (event, context, callback).
exports.handler = serverless(app);