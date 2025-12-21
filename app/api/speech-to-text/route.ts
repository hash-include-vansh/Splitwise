import { NextRequest, NextResponse } from 'next/server'

/**
 * Speech-to-Text API route using cloud-based services
 * This is a fallback for browsers that don't support Web Speech API (like iOS Chrome)
 * 
 * Supports:
 * 1. Google Cloud Speech-to-Text (if GOOGLE_CLOUD_SPEECH_API_KEY is set)
 * 2. AssemblyAI (if ASSEMBLYAI_API_KEY is set)
 * 
 * At least one API key must be configured for this to work.
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

    // Try AssemblyAI first (recommended - free tier available, no billing required)
    if (process.env.ASSEMBLYAI_API_KEY) {
      try {
        return await tryAssemblyAI(audioBlob)
      } catch (assemblyError) {
        console.error('AssemblyAI failed:', assemblyError)
        // If AssemblyAI fails, try Google Cloud as fallback (if configured)
        if (process.env.GOOGLE_CLOUD_SPEECH_API_KEY || process.env.GEMINI_API_KEY) {
          try {
            return await tryGoogleCloudSpeech(audioBlob)
          } catch (googleError) {
            console.error('Google Cloud Speech also failed:', googleError)
            throw assemblyError // Throw original AssemblyAI error
          }
        }
        throw assemblyError
      }
    }

    // Try Google Cloud Speech-to-Text (optional, requires billing account)
    if (process.env.GOOGLE_CLOUD_SPEECH_API_KEY || process.env.GEMINI_API_KEY) {
      try {
        return await tryGoogleCloudSpeech(audioBlob)
      } catch (googleError) {
        console.error('Google Cloud Speech failed:', googleError)
        throw googleError
      }
    }

    // No API keys configured
    return NextResponse.json(
      { 
        error: 'Speech-to-text API key not configured. Please add ASSEMBLYAI_API_KEY to your environment variables. See README for setup instructions. (Google Cloud Speech-to-Text is optional and requires a billing account)',
        transcript: null 
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Speech-to-text error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to transcribe audio',
        transcript: null,
      },
      { status: 500 }
    )
  }
}

/**
 * Try Google Cloud Speech-to-Text API
 */
async function tryGoogleCloudSpeech(audioBlob: Blob) {
  const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_SPEECH_API_KEY || process.env.GEMINI_API_KEY
  
  if (!GOOGLE_CLOUD_API_KEY) {
    throw new Error('Google Cloud Speech API key not configured')
  }

  // Convert blob to base64 for API
  const arrayBuffer = await audioBlob.arrayBuffer()
  const base64Audio = Buffer.from(arrayBuffer).toString('base64')

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
          encoding: 'WEBM_OPUS',
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
    throw new Error(`Google Cloud Speech API error: ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  
  if (data.results && data.results.length > 0 && data.results[0].alternatives && data.results[0].alternatives.length > 0) {
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
}

/**
 * Fallback to AssemblyAI (free tier available)
 */
async function tryAssemblyAI(audioBlob: Blob) {
  const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
  
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('AssemblyAI API key not configured')
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
    const errorData = await uploadResponse.json().catch(() => ({}))
    throw new Error(`Failed to upload audio to AssemblyAI: ${JSON.stringify(errorData)}`)
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
    const errorData = await transcriptResponse.json().catch(() => ({}))
    throw new Error(`Failed to start transcription: ${JSON.stringify(errorData)}`)
  }

  const { id } = await transcriptResponse.json()

  // Poll for results (max 30 seconds)
  let transcript = ''
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: {
        authorization: ASSEMBLYAI_API_KEY,
      },
    })

    if (!statusResponse.ok) {
      throw new Error('Failed to check transcription status')
    }

    const statusData = await statusResponse.json()

    if (statusData.status === 'completed') {
      transcript = statusData.text || ''
      break
    } else if (statusData.status === 'error') {
      throw new Error(statusData.error || 'Transcription failed')
    }
  }

  if (!transcript) {
    throw new Error('Transcription timeout - no result after 30 seconds')
  }

  return NextResponse.json({
    transcript,
    error: null,
  })
}
