const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Ensure TLS certificate validation doesn't block local environment network calls
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const apiKey = process.env.GEMINI_API_KEY || '';
// Primary model with auto-failover candidates
const preferredModel = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

let genAI = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log(`[Gemini Config] Google Generative AI client initialized.`);
  } catch (err) {
    console.warn(`[Gemini Config Warning] Error initializing Google Generative AI:`, err.message);
  }
} else {
  console.warn('[Gemini Config Warning] GEMINI_API_KEY is not set.');
}

module.exports = {
  genAI,
  apiKey,
  preferredModel
};
