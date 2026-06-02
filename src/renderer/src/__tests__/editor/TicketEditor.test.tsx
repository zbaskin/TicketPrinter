// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TicketEditor from '../../editor/TicketEditor'

beforeEach(() => {
  Object.defineProperty(window, 'printerApi', {
    value: { print: vi.fn(), listPrinters: vi.fn().mockResolvedValue([]) },
    writable: true,
    configurable: true
  })
  localStorage.clear()
})

describe('TicketEditor', () => {
  it('renders the ElementPalette (Text button visible)', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()
  })

  it('renders the EditorCanvas (svg visible)', () => {
    const { container } = render(<TicketEditor />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders the PropertiesPanel (select an element text visible)', () => {
    render(<TicketEditor />)
    expect(screen.getByText(/select an element/i)).toBeInTheDocument()
  })

  it('renders the FglSourcePanel (pre block with HEAT visible)', () => {
    const { container } = render(<TicketEditor />)
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre!.textContent).toContain('<HEAT 10>')
  })

  it('stock selector change updates document stock to CINEMA', () => {
    const { container } = render(<TicketEditor />)
    const select = screen.getByLabelText(/stock/i)
    fireEvent.change(select, { target: { value: 'CINEMA' } })
    // After changing to CINEMA, exclusion zone should appear in canvas
    const exclusionZone = container.querySelector('[data-testid="exclusion-zone"]')
    expect(exclusionZone).not.toBeNull()
  })

  it('Print button is disabled when no printer is in localStorage', () => {
    render(<TicketEditor />)
    const printBtn = screen.getByRole('button', { name: /print/i })
    expect(printBtn).toBeDisabled()
  })

  it('Print button is enabled when a printer is in localStorage', () => {
    localStorage.setItem('selectedPrinter', 'Boca Lemur')
    render(<TicketEditor />)
    const printBtn = screen.getByRole('button', { name: /print/i })
    expect(printBtn).not.toBeDisabled()
  })
})
