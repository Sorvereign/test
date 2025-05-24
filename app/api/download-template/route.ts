import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

const templateData = [
  {
    ID: 'C001',
    Nombre: 'Juan Pérez',
    Habilidades: 'React, TypeScript, NextJS, TailwindCSS',
    Experiencia: 5.2,
    Educacion: 'Ingeniero en Sistemas, Universidad Nacional',
    Email: 'juan.perez@example.com'
  },
  {
    ID: 'C002',
    Nombre: 'María Rodríguez',
    Habilidades: 'UI/UX, Figma, HTML, CSS, JavaScript',
    Experiencia: 3.5,
    Educacion: 'Diseñadora UX/UI, Certificación Google',
    Email: 'maria.rodriguez@example.com'
  },
  {
    ID: 'C003',
    Nombre: '',
    Habilidades: '',
    Experiencia: '',
    Educacion: '',
    Email: ''
  }
]

export async function GET() {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'candidates.xlsx'),
      path.join(process.cwd(), 'data', 'candidates.xlsx')
    ]
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath)
        
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        headers.set('Content-Disposition', 'attachment; filename="plantilla_candidatos.xlsx"')
        
        return new NextResponse(buffer, { 
          status: 200,
          headers
        })
      }
    }
    
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidatos')
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', 'attachment; filename="plantilla_candidatos.xlsx"')
    
    return new NextResponse(buffer, { 
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error generando plantilla:', error)
    return NextResponse.json(
      { error: 'Error generando la plantilla' },
      { status: 500 }
    )
  }
} 