#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export async function setupAuthentication() {
  console.log('🔑 Setting up authentication...')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  // Try to sign up, if user exists, sign in
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123'
  })

  await adminSupabase.from("user").update({is_admin: true}).eq("email", "test@example.com")
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword123'
  })
  
  if (signInError) {
    throw new Error(`Authentication failed: ${signInError.message}`)
  }
  
  const accessToken = signInData.session.access_token
  const userEmail = signInData.user.app_metadata.email
  
  console.log('✅ Authentication setup complete')
  console.log(signInData.user.app_metadata)
  console.log(`📋 User Email: ${userEmail}`)
  console.log('')
  
  return {
    accessToken,
    userEmail
  }
}

export default setupAuthentication