import { NextRequest, NextResponse } from 'next/server'

/**
 * Speech-to-Text API route using Google Cloud Speech-to-Text
 * This is a fallback for browsers that don't support Web Speech API (like iOS Chrome)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as Blob
    
    if (!audioBlob) {
      return NextResponse.json(
        { error: 'No audio file provided', transcript: null },
        { status: 400 }
      )
    }

    // Check if we have Google Cloud credentials
    // For now, we'll use a free alternative: AssemblyAI or Deepgram
    // But first, let's try using the browser's native capabilities if available
    
    // Convert blob to base64 for API
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString('base64')
    
    // Use a free speech-to-text service
    // Option 1: Use Google Cloud Speech-to-Text (requires API key)
    // Option 2: Use AssemblyAI (free tier available)
    // Option 3: Use Deepgram (free tier available)
    
    // For now, let's use a simple approach: we'll guide users to use the native iOS keyboard
    // But we can also implement a proper cloud service
    
    // Actually, let's use Google Cloud Speech-to-Text since they might have access
    // But we need to check if they have the API key
    
    // For MVP, let's use a simpler approach: record audio and send to a free service
    // Or we can use the Web Speech API polyfill approach
    
    // Let me implement using Google Cloud Speech-to-Text API
    const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_SPEECH_API_KEY || process.env.GEMINI_API_KEY
    
    if (!GOOGLE_CLOUD_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Speech-to-text API key not configured. Please add GOOGLE_CLOUD_SPEECH_API_KEY to your environment variables.',
          transcript: null 
        },
        { status: 500 }
      )
    }

    // Use Google Cloud Speech-to-Text API
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS', // Adjust based on audio format
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            alternativeLanguageCodes: ['en-IN', 'en-GB'],
          },
          audio: {
            content: base64Audio,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google Cloud Speech API error:', errorData)
      
      // If Google Cloud fails, try AssemblyAI as fallback
      return await tryAssemblyAI(audioBlob)
    }

    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      const transcript = data.results[0].alternatives[0].transcript
      return NextResponse.json({ 
        transcript,
        error: null 
      })
    }

    return NextResponse.json({
      transcript: '',
      error: 'No speech detected',
    })
  } catch (error: any) {
    console.error('Speech-to-text error:', error)
    
    // Try AssemblyAI as fallback
    try {
      const fallbackResult = await tryAssemblyAI(
        (await request.formData()).get('audio') as Blob
      )
      return fallbackResult
    } catch (fallbackError) {
      return NextResponse.json(
        {
          error: error.message || 'Failed to transcribe audio',
          transcript: null,
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Fallback to AssemblyAI (free tier available)
 */
async function tryAssemblyAI(audioBlob: Blob) {
  const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
  
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('No speech-to-text API configured')
  }

  // Upload audio to AssemblyAI
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
    },
    body: audioBlob,
  })

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload audio to AssemblyAI')
  }

  const { upload_url } = await uploadResponse.json()

  // Start transcription
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: 'en_us',
    }),
  })

  if (!transcriptResponse.ok) {
    throw new Error('Failed to start transcription')
  }

  const { id } = await transcriptResponse.json()

  // Poll for results
  let transcript = ''
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: {
        authorization: ASSEMBLYAI_API_KEY,
      },
    })

    const statusData = await statusResponse.json()

    if (statusData.status === 'completed') {
      transcript = statusData.text
      break
    } else if (statusData.status === 'error') {
      throw new Error(statusData.error)
    }
  }

  if (!transcript) {
    throw new Error('Transcription timeout')
  }

  return NextResponse.json({
    transcript,
    error: null,
  })
}

