import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const body = await req.json();
    const { text, mood} = body;

    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    // Mood detection (only if mood not provided)
    let moodData;

    if (mood) {
      moodData = { mood, energyLevel: "medium" };
    } else {
      const moodPrompt = `
You are an advanced mood analyzer.

Return ONLY valid JSON:
{
  "primaryMood": "romantic|happy|sad|angry|chill",
  "secondaryMood": "romantic|happy|sad|angry|chill|null",
  "energyLevel": "low|medium|high",
  "language": "Hindi|English"
}

Rules:
- Detect compound moods if present (e.g. romantic + sad)
- Detect song language preference from text
- If unsure, default language to English

User text:
${text}
`;


      const moodResult = await model.generateContent(moodPrompt);
      const moodText = moodResult.response.text();

      moodData = JSON.parse(moodText);
    }

    // Song recommendation
    const songPrompt = `
You are a music recommendation assistant.

Return ONLY valid JSON:
{
  "songs": [
    {
      "title": "string",
      "artist": "string",
      "reason": "string",
      "spotifyQuery": "string",
      "youtubeQuery": "string"
    }
  ]
}

Rules:
- Return EXACTLY 5 songs
- Songs MUST be in ${moodData.language}
- Match the mood blend:
  Primary: ${moodData.primaryMood}
  Secondary: ${moodData.secondaryMood}
- Energy: ${moodData.energyLevel}
- Avoid repeating previous songs
- Give fresh recommendations every time

spotifyQuery format:
"title artist"

youtubeQuery format:
"title artist official audio"

User text:
${text || ""}
`;


    const songResult = await model.generateContent(songPrompt);
    const songText = songResult.response.text();

    const songsData = JSON.parse(songText);

    return Response.json({
      success: true,
      mood: {
        primaryMood: moodData.primaryMood,
        secondaryMood: moodData.secondaryMood,
        energyLevel: moodData.energyLevel,
        language: moodData.language,
      },
      songs: songsData.songs || [],
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
