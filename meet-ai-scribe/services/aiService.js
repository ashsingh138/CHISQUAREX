const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.summarize = async (text) => {
  if (!text || text.trim() === "") {
    return "No transcript captured yet. Please ensure the bot is in the meeting and people are speaking.";
  }

  try {
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using Gemini 1.5 Flash for fast, cost-effective text generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an expert executive assistant. Summarize the following meeting transcript clearly and concisely.
    
    Structure your response using markdown with the following sections:
    - **Key Points:** A brief overview of what was discussed.
    - **Decisions Made:** Any concrete conclusions reached.
    - **Action Items:** A bulleted list of next steps.

    Meeting Transcript:
    """
    ${text}
    """
    `;

    console.log("🧠 Generating summary via Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("❌ AI Summarization Error:", error);
    throw new Error("Failed to generate AI summary.");
  }
};