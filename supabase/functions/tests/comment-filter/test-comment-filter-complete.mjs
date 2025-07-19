#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/comment-filter'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

let testPostId = null

async function testRequest(method, data, description, expectedStatus, headers = {}) {
  console.log(`📝 ${description}`)
  console.log(`Method: ${method}`)
  console.log(`Expected Status: ${expectedStatus}`)
  
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined
    })
    
    const body = await response.text()
    let result
    try {
      result = JSON.parse(body)
    } catch {
      result = body
    }
    
    console.log(`Actual Status: ${response.status}`)
    console.log(`Response: ${JSON.stringify(result)}`)
    
    if (response.status !== expectedStatus) {
      console.log(`❌ Test failed: expected ${expectedStatus}, got ${response.status}`)
      return { success: false, response: result, status: response.status }
    } else {
      console.log(`✅ Test passed`)
      return { success: true, response: result, status: response.status }
    }
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function setupTestData() {
  console.log('🔧 Setting up test data...')
  
  try {
    // Create test user first
    const { error: userError } = await supabase
      .from('user')
      .insert([{
        id: 'test-user-001',
        username: 'testuser',
        email: 'test@example.com',
        is_admin: true
      }])

    if (userError) {
      console.error('Error creating test user:', userError)
      throw userError
    }

    // Create test post
    const { data: postData, error: postError } = await supabase
      .from('post')
      .insert([{
        id: 'test-post-001',
        user_id: 'test-user-001',
        title: 'Test Post for Comments',
        content: 'This is a test post for comment filtering.',
        status: 'published'
      }])
      .select()
      .single()

    if (postError) {
      console.error('Error creating test post:', postError)
      throw postError
    }

    testPostId = postData.id
    console.log(`✅ Test post created: ${testPostId}`)

    // Insert test filter keywords
    const { error: keywordError } = await supabase
      .from('filter_keyword')
      .insert([
        {
          id: 'test-keyword-001',
          keyword: 'spam',
          is_case_sensitive: false,
          is_active: true
        },
        {
          id: 'test-keyword-002',
          keyword: 'BadWord',
          is_case_sensitive: true,
          is_active: true
        }
      ])

    if (keywordError && !keywordError.message.includes('duplicate key')) {
      console.error('Error creating test keywords:', keywordError)
      throw keywordError
    }

    console.log('✅ Test data setup complete')
  } catch (error) {
    console.error('Setup failed:', error)
    throw error
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...')
  
  try {
    // Delete test comments - any comment for the test post
    await supabase
      .from('comment')
      .delete()
      .eq('post_id', 'test-post-001')

    // Delete test post
    await supabase
      .from('post')
      .delete()
      .eq('id', 'test-post-001')

    // Delete test user
    await supabase
      .from('user')
      .delete()
      .eq('id', 'test-user-001')

    // Delete test keywords
    await supabase
      .from('filter_keyword')
      .delete()
      .like('id', 'test-keyword-%')

    console.log('✅ Cleanup complete')
  } catch (error) {
    console.warn('Cleanup error (this is usually ok):', error.message)
  }
}

async function runTests() {
  console.log('🚀 Starting comment-filter edge function tests...\n')
  
  const results = []
  
  // Test 1: OPTIONS request
  results.push(await testRequest('OPTIONS', null, 'OPTIONS request should return 200', 200))
  
  // Test 2: GET request (should fail)
  results.push(await testRequest('GET', null, 'GET request should return 405', 405))
  
  // Test 3: POST without body (should fail)
  results.push(await testRequest('POST', null, 'POST without body should return 400', 400))
  
  // Test 4: POST with invalid data (should fail)
  results.push(await testRequest('POST', {}, 'POST with empty data should return 400', 400))
  
  // Test 5: POST with missing required fields
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser'
    // Missing password and content
  }, 'POST with missing fields should return 400', 400))
  
  // Test 6: POST with invalid username (too short)
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'a',
    password: 'password123',
    content: 'This is a test comment with enough content to pass validation.'
  }, 'POST with invalid username should return 400', 400))
  
  // Test 7: POST with invalid content (too short)
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: 'short'
  }, 'POST with short content should return 400', 400))
  
  // Test 8: POST with valid data (should succeed)
  const validCommentResult = await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: 'This is a great article! I really enjoyed reading it and learned a lot.'
  }, 'POST with valid data should return 201', 201)
  results.push(validCommentResult)
  
  // Test 9: POST with flagged content (should succeed but be flagged)
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: 'This is spam content that should be flagged by the filter system.'
  }, 'POST with flagged content should return 201', 201))
  
  // Test 10: POST with case-sensitive flagged content
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: 'This contains BadWord which should be flagged due to case sensitivity.'
  }, 'POST with case-sensitive flagged content should return 201', 201))
  
  // Test 11: POST with case-insensitive flagged content
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: 'This contains badword which should not be flagged (case mismatch).'
  }, 'POST with case-insensitive variation should return 201', 201))
  
  // Test 12: POST with reply to parent comment
  if (validCommentResult.success && validCommentResult.response.comment_id) {
    results.push(await testRequest('POST', {
      post_id: testPostId,
      username: 'anotheruser',
      password: 'password456',
      content: 'This is a reply to the parent comment with sufficient content.',
      parent_comment_id: validCommentResult.response.comment_id
    }, 'POST with parent comment should return 201', 201))
  }
  
  // Test 13: POST with invalid parent comment
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: 'This is a reply to a non-existent parent comment.',
    parent_comment_id: 'non-existent-comment'
  }, 'POST with invalid parent comment should return 500', 500))
  
  // Test 14: POST with non-existent post
  results.push(await testRequest('POST', {
    post_id: 'non-existent-post',
    username: 'testuser',
    password: 'password123',
    content: 'This comment is for a non-existent post.'
  }, 'POST with non-existent post should return 500', 500))
  
  // Test 15: POST with comment update (with comment_id)
  if (validCommentResult.success && validCommentResult.response.comment_id) {
    results.push(await testRequest('POST', {
      post_id: testPostId,
      username: 'testuser',
      password: 'password123',
      content: 'This is an updated comment with new content that meets minimum length.',
      comment_id: validCommentResult.response.comment_id
    }, 'POST with comment_id should update comment and return 201', 201))
  }
  
  // Test 16: POST with XSS content (should be sanitized)
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: 'This is a comment with <script>alert("xss")</script> dangerous content that should be handled.'
  }, 'POST with XSS content should return 201', 201))
  
  // Test 17: POST with special characters in username
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'test<user>',
    password: 'password123',
    content: 'This comment has special characters in username which should be rejected.'
  }, 'POST with invalid username characters should return 400', 400))
  
  // Test 18: POST with maximum length content
  const maxLengthContent = 'A'.repeat(2000)
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: maxLengthContent
  }, 'POST with maximum length content should return 201', 201))
  
  // Test 19: POST with content exceeding maximum length
  const tooLongContent = 'A'.repeat(2001)
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: tooLongContent
  }, 'POST with too long content should return 400', 400))
  
  // Test 20: POST with minimum length content
  const minLengthContent = 'A'.repeat(10)
  results.push(await testRequest('POST', {
    post_id: testPostId,
    username: 'testuser',
    password: 'password123',
    content: minLengthContent
  }, 'POST with minimum length content should return 201', 201))
  
  // Summary
  console.log('\n📊 Test Summary')
  console.log('================')
  const passed = results.filter(r => r.success).length
  const total = results.length
  console.log(`Passed: ${passed}/${total}`)
  console.log(`Failed: ${total - passed}/${total}`)
  
  if (passed === total) {
    console.log('🎉 All tests passed!')
    return true
  } else {
    console.log('❌ Some tests failed!')
    return false
  }
}

async function main() {
  try {
    await setupTestData()
    const success = await runTests()
    await cleanupTestData()
    
    if (success) {
      console.log('\n✅ comment-filter edge function tests completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ comment-filter edge function tests failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error('Test execution failed:', error)
    await cleanupTestData()
    process.exit(1)
  }
}

main()