import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import { SECTIONS } from '../data/sections'
import type { Session } from '../types'

const SECTION_TITLES: Record<string, string> = {
  basics: 'Introduction',
  story: 'Brand Story',
  values: 'Brand Values',
  personality: 'Brand Personality',
  visuals_colors: 'Color Palette',
  visuals_logo: 'Logo & Name',
  typography: 'Typography',
  messaging: 'Key Messages',
  application: 'Brand in Use',
  social_media: 'Social Media Guidelines',
  photography: 'Photography & Imagery',
}

export function generateMarkdown(session: Session): string {
  const orgName = session.brandData.orgName || 'Your Organization'
  const lines: string[] = []

  lines.push(`# ${orgName}`)
  lines.push('')
  lines.push('## Brand Guidelines')
  lines.push('')
  lines.push('*Version 1.0*')
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const section of SECTIONS) {
    const state = session.sections[section.id]
    if (!state || state.status !== 'approved' || !state.approvedDraft) continue

    const title = SECTION_TITLES[section.id] || section.title
    lines.push(`## ${title}`)
    lines.push('')
    lines.push(state.approvedDraft)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  lines.push(`*${orgName} Brand Guidelines v1.0*`)
  return lines.join('\n')
}

export function downloadMarkdown(session: Session) {
  const md = generateMarkdown(session)
  const filename = `${(session.brandData.orgName || 'brand').replace(/\s+/g, '-').toLowerCase()}-brand-guide.md`
  const blob = new Blob([md], { type: 'text/markdown' })
  saveAs(blob, filename)
}

export async function downloadDocx(session: Session) {
  const orgName = session.brandData.orgName || 'Your Organization'

  const children: Paragraph[] = []

  // Cover page
  children.push(new Paragraph({ spacing: { before: 4000 } }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: orgName, bold: true, size: 72, font: 'Arial' })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [new TextRun({ text: 'Brand Guidelines', size: 32, color: '64748b', font: 'Arial' })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: 'Version 1.0', size: 20, color: '94a3b8', font: 'Arial' })],
  }))
  children.push(new Paragraph({ children: [new PageBreak()] }))

  // Sections
  for (const section of SECTIONS) {
    const state = session.sections[section.id]
    if (!state || state.status !== 'approved' || !state.approvedDraft) continue

    const title = SECTION_TITLES[section.id] || section.title

    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: title, bold: true, size: 36, font: 'Arial' })],
    }))

    const paragraphs = state.approvedDraft.split('\n\n').filter(Boolean)
    for (const p of paragraphs) {
      children.push(new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: p.replace(/\n/g, ' '), size: 24, font: 'Arial' })],
      }))
    }

    children.push(new Paragraph({
      spacing: { before: 300, after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e8e4df', space: 1 } },
    }))
  }

  // Footer
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: `${orgName} Brand Guidelines v1.0`, size: 18, color: '94a3b8', font: 'Arial' })],
  }))

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  })

  const buffer = await Packer.toBlob(doc)
  const filename = `${(orgName).replace(/\s+/g, '-').toLowerCase()}-brand-guide.docx`
  saveAs(buffer, filename)
}
