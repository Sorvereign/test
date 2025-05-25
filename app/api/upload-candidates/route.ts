import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
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
        console.log('Candidates file upload completed:', {
          url: blob.url,
          pathname: blob.pathname
        })

        try {
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