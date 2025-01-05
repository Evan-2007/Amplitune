// supabase/functions/apple-music-token/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"
import { importPKCS8 } from "https://deno.land/x/jose@v4.14.4/key/import.ts"

serve(async (req) => {
  try {
    // Check if request is coming from allowed origins
    const origin = req.headers.get('origin')
    const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || []
    
    // if (!allowedOrigins.includes(origin || '')) {
    //   return new Response('Unauthorized origin', { status: 401 })
    // }

    // Get the private key from environment variable
    const privateKeyPEM = Deno.env.get('APPLE_MUSIC_PRIVATE_KEY')
    if (!privateKeyPEM) {
      throw new Error('Private key not configured')
    }

    // Import the private key
    const privateKey = await importPKCS8(privateKeyPEM, 'ES256')

    // Current time in seconds since epoch
    const now = Math.floor(Date.now() / 1000)

    // Create the token
    const token = await create(
      { alg: 'ES256', kid: Deno.env.get('APPLE_MUSIC_KEY_ID') },
      {
        iss: Deno.env.get('APPLE_MUSIC_TEAM_ID'),
        iat: now,
        exp: getNumericDate(15777000) // 6 months in seconds
  //      origin: allowedOrigins
      },
      privateKey
    )

    return new Response(
      JSON.stringify({ token }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  } catch (error) {
    console.error('Error generating token:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate token' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/musicKitJWT' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
