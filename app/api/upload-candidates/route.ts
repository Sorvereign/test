import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    // Check content length before processing
    const contentLength = request.headers.get('content-length')
    const maxSize = 10 * 1024 * 1024 // 10MB limit
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 413 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Additional file size check
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 10MB.` },
        { status: 413 }
      )
    }

    // Validate file type
    const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
                    file.type === "application/vnd.ms-excel" ||
                    file.name.endsWith('.xlsx') ||
                    file.name.endsWith('.xls')
    
    if (!isExcel) {
      return NextResponse.json(
        { error: 'File must be an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const blob = await put(`candidates/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading file to blob storage:', error)
    
    // Check if it's a size limit error
    if (error instanceof Error && error.message.includes('limit')) {
      return NextResponse.json(
        { error: 'File too large for upload' },
        { status: 413 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
} 