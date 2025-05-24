import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        // Validate file type based on pathname
        const isExcel = pathname.endsWith('.xlsx') || pathname.endsWith('.xls')
        
        if (!isExcel) {
          throw new Error('File must be an Excel file (.xlsx or .xls)')
        }

        return {
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
          ],
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
            fileType: 'candidates'
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        console.log('Candidates file upload completed:', {
          url: blob.url,
          pathname: blob.pathname,
          tokenPayload
        })

        try {
          // Here you could update a database or perform other actions
          // For now, we just log the successful upload
          console.log('File successfully uploaded to blob storage:', blob.url)
        } catch (error) {
          console.error('Error processing upload completion:', error)
          throw new Error('Could not process file upload')
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Error handling upload:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
} 