import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        
        // Validate that it's an Excel file based on the pathname
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
          pathname: blob.pathname
        })

        try {
          // You could run additional logic here
          // For example: validate the Excel content, send notifications, etc.
          if (tokenPayload) {
            const payload = JSON.parse(tokenPayload)
            console.log('Upload metadata:', payload)
          }
        } catch (error) {
          console.error('Error processing upload completion:', error)
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Error in client upload handler:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
} 