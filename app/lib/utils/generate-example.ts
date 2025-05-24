import * as XLSX from 'xlsx'
import { writeFile } from 'fs/promises'
import path from 'path'

const candidatesData = [
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
    Nombre: 'Carlos Gómez',
    Habilidades: 'Python, Django, SQL, React, AWS',
    Experiencia: 7.8,
    Educacion: 'Máster en Ciencia de Datos, Universidad Tecnológica',
    Email: 'carlos.gomez@example.com'
  },
  {
    ID: 'C004',
    Nombre: 'Ana López',
    Habilidades: 'React, Redux, Node.js, MongoDB, Express',
    Experiencia: 4.3,
    Educacion: 'Bootcamp Desarrollo Web Full Stack, Certificación AWS',
    Email: 'ana.lopez@example.com'
  },
  {
    ID: 'C005',
    Nombre: 'Pedro Martínez',
    Habilidades: 'Vue.js, JavaScript, CSS, HTML, Firebase',
    Experiencia: 2.9,
    Educacion: 'Ingeniero en Informática, Curso Avanzado Frontend',
    Email: 'pedro.martinez@example.com'
  },
  {
    ID: 'C006',
    Nombre: 'Laura Fernández',
    Habilidades: 'Angular, TypeScript, .NET, C#, SQL Server',
    Experiencia: 6.1,
    Educacion: 'Ingeniera de Software, Certificación Microsoft',
    Email: 'laura.fernandez@example.com'
  },
  {
    ID: 'C007',
    Nombre: 'Miguel Sánchez',
    Habilidades: 'Java, Spring Boot, React, MySQL, Docker',
    Experiencia: 8.2,
    Educacion: 'Máster en Ingeniería de Software, Universidad Politécnica',
    Email: 'miguel.sanchez@example.com'
  },
  {
    ID: 'C008',
    Nombre: 'Sofia Díaz',
    Habilidades: 'Python, React, Flask, PostgreSQL, Docker',
    Experiencia: 3.8,
    Educacion: 'Ingeniera en Sistemas, Bootcamp Data Science',
    Email: 'sofia.diaz@example.com'
  }
]

export async function generateExampleFile() {
  const workbook = XLSX.utils.book_new()
  
  const worksheet = XLSX.utils.json_to_sheet(candidatesData)
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidatos')
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const filePath = path.join(process.cwd(), 'public', 'candidates-example.xlsx')
  
  await writeFile(filePath, buffer)
  
  return filePath
} 