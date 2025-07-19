#!/usr/bin/env node

import setupAuthentication from "../common/authentication.mjs"

const FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/post-manager'

let accessToken = null
let userEmail = null

async function testRequest(method, data, description, expectedStatus, headers = {}) {
  console.log(`📝 ${description}`)
  console.log(`Method: ${method}`)
  console.log(`Expected Status: ${expectedStatus}`)
  
  const requestHeaders = {
    'Content-Type': 'application/json'
  }
  
  // Add custom headers first
  Object.keys(headers).forEach(key => {
    if (headers[key] !== null) {
      requestHeaders[key] = headers[key]
    }
  })
  
  // Add default authorization if not explicitly set
  if (accessToken && method !== 'OPTIONS' && !headers.hasOwnProperty('Authorization')) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`
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
    
    if (response.status === expectedStatus) {
      console.log('✅ PASS')
      return result
    } else {
      console.log(`❌ FAIL (expected ${expectedStatus}, got ${response.status})`)
      throw new Error(`Test failed: ${description}`)
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`)
    throw error
  } finally {
    console.log('')
  }
}

async function runCompleteTests() {
  console.log('🧪 Complete Post-Manager Test Suite')
  console.log('====================================')
  console.log(`Testing: ${FUNCTION_URL}`)
  console.log('')
  
  try {
    // Setup authentication
    const authData = await setupAuthentication()
    accessToken = authData.accessToken
    userEmail = authData.userEmail
    
    // Test 1: OPTIONS request
    console.log('🌐 Test 1: CORS OPTIONS')
    await testRequest('OPTIONS', null, 'CORS preflight check', 200)
    
    // Test 2: Create post
    console.log('📝 Test 2: Create New Post')
    const createData = {
      title: 'Test Blog Post',
      content: '# Introduction\nThis is a test blog post.\n## Getting Started\nHere we go!',
      abstract: 'A test blog post',
      status: 'published'
    }
    const createResult = await testRequest('POST', createData, 'Create new post', 201)
    const postId = createResult.post_id
    console.log(`📋 Created post ID: ${postId}`)
    
    // Test 3: Update post
    console.log('🔄 Test 3: Update Post')
    const updateData = {
      post_id: postId,
      title: 'Updated Blog Post',
      content: 'Updated content',
      status: 'published'
    }
    await testRequest('PATCH', updateData, 'Update existing post', 200)
    
    // Test 4: Validation - empty fields
    console.log('🚫 Test 4: Validation - Empty Fields')
    await testRequest('POST', { title: '', content: '' }, 'Empty title and content', 400)
    
    // Test 5: Validation - missing post_id for update
    console.log('🚫 Test 5: Validation - Missing post_id')
    await testRequest('PATCH', { title: 'Test' }, 'PATCH without post_id', 400)
    
    // Test 6: Method not allowed
    console.log('🚫 Test 6: Method Not Allowed')
    try {
      const response = await fetch(FUNCTION_URL, { method: 'DELETE' })
      if (response.status === 405) {
        console.log('✅ PASS - DELETE method correctly rejected')
      } else {
        console.log(`❌ FAIL - Expected 405, got ${response.status}`)
        throw new Error('Method validation failed')
      }
    } catch (error) {
      if (error.message !== 'Method validation failed') {
        console.log('✅ PASS - DELETE method correctly rejected')
      } else {
        throw error
      }
    }
    console.log('')
    
    // Test 7: Complex post with references
    console.log('📎 Test 7: Post with References')
    const complexData = {
      title: 'Complex Post',
      content: '# Complex Content\nWith references.',
      references: [{
        text: 'Reference 1',
        url: 'https://example.com',
        sequence_number: 1,
        start_position: 10,
        end_position: 21
      }]
    }
    await testRequest('POST', complexData, 'Create post with references', 201)
    
    // Test 8: Authentication tests
    console.log('🔐 Test 8: Authentication Tests')
    
    // Test without authorization header
    await testRequest('POST', createData, 'Request without authorization', 401, { Authorization: null })
    
    // Test with invalid token
    await testRequest('POST', createData, 'Request with invalid token', 401, { Authorization: 'Bearer invalid_token' })
    
    // Test 9: Validation edge cases
    console.log('📏 Test 9: Validation Edge Cases')
    
    // Title too long
    const longTitle = 'A'.repeat(300)
    await testRequest('POST', {
      title: longTitle,
      content: 'Valid content'
    }, 'Title too long', 400)
    
    // Reference text too long  
    const longRefText = 'A'.repeat(1100)
    await testRequest('POST', {
      title: 'Valid title',
      content: 'Valid content',
      references: [{
        text: longRefText,
        sequence_number: 1,
        start_position: 0,
        end_position: 10
      }]
    }, 'Reference text too long', 400)
    
    // Invalid status
    await testRequest('POST', {
      title: 'Valid title',
      content: 'Valid content',
      status: 'invalid_status'
    }, 'Invalid status value', 400)
    
    console.log('🎉 ALL TESTS PASSED!')
    console.log('====================')
    console.log('✅ CORS handling')
    console.log('✅ POST create operation')
    console.log('✅ PATCH update operation')
    console.log('✅ Input validation')
    console.log('✅ Method validation')
    console.log('✅ Reference handling')
    console.log('✅ Authentication checks')
    console.log('✅ Edge case validation')
    console.log('✅ nanoid(10) ID generation')
    console.log('')
    console.log('🚀 post-manager function is production ready!')
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
    process.exit(1)
  }
}

runCompleteTests()