// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FglEditorPanel from '../../editor/FglEditorPanel'
import type { TicketDocument } from '../../../../fgl/types'
import { compile } from '../../../../fgl/compiler'

const baseDoc: TicketDocument = {
  stock: 'CONCERT',
  heat: 10,
  elements: [
    { type: 'text', row: 100, col: 100, font: 3, content: 'Hello' }
  ]
}

const docWithOverride: TicketDocument = {
  ...baseDoc,
  rawFglOverride: '<HEAT 5><NF>OVERRIDE<p>'
}

describe('FglEditorPanel', () => {
  it('renders textarea with compiled FGL when no override', () => {
    render(
      <FglEditorPanel document={baseDoc} onApply={vi.fn()} onRevert={vi.fn()} />
    )
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect((textarea as HTMLTextAreaElement).value).toBe(compile(baseDoc))
  })

  it('renders textarea with override text when override is active', () => {
    render(
      <FglEditorPanel document={docWithOverride} onApply={vi.fn()} onRevert={vi.fn()} />
    )
    const textarea = screen.getByRole('textbox')
    expect((textarea as HTMLTextAreaElement).value).toBe('<HEAT 5><NF>OVERRIDE<p>')
  })

  it('shows override active banner when rawFglOverride is set', () => {
    render(
      <FglEditorPanel document={docWithOverride} onApply={vi.fn()} onRevert={vi.fn()} />
    )
    expect(screen.getByText(/FGL override active/i)).toBeInTheDocument()
  })

  it('does NOT show banner when no override', () => {
    render(
      <FglEditorPanel document={baseDoc} onApply={vi.fn()} onRevert={vi.fn()} />
    )
    expect(screen.queryByText(/FGL override active/i)).toBeNull()
  })

  it('"Apply" with non-empty text calls onApply', () => {
    const onApply = vi.fn()
    render(
      <FglEditorPanel document={baseDoc} onApply={onApply} onRevert={vi.fn()} />
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '<HEAT 5><NF><p>' } })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(onApply).toHaveBeenCalledWith('<HEAT 5><NF><p>')
  })

  it('"Apply" with empty text shows error, does NOT call onApply', () => {
    const onApply = vi.fn()
    render(
      <FglEditorPanel document={baseDoc} onApply={onApply} onRevert={vi.fn()} />
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(onApply).not.toHaveBeenCalled()
    expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument()
  })

  it('"Apply" with text > 65536 bytes shows error, does NOT call onApply', () => {
    const onApply = vi.fn()
    render(
      <FglEditorPanel document={baseDoc} onApply={onApply} onRevert={vi.fn()} />
    )
    const textarea = screen.getByRole('textbox')
    // Create a string that exceeds 65536 bytes
    const bigText = 'A'.repeat(65537)
    fireEvent.change(textarea, { target: { value: bigText } })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(onApply).not.toHaveBeenCalled()
    expect(screen.getByText(/65536/i)).toBeInTheDocument()
  })

  it('"Revert to Visual" calls onRevert', () => {
    const onRevert = vi.fn()
    render(
      <FglEditorPanel document={docWithOverride} onApply={vi.fn()} onRevert={onRevert} />
    )
    fireEvent.click(screen.getByRole('button', { name: /revert/i }))
    expect(onRevert).toHaveBeenCalledTimes(1)
  })

  it('inline error clears after successful Apply', () => {
    const onApply = vi.fn()
    render(
      <FglEditorPanel document={baseDoc} onApply={onApply} onRevert={vi.fn()} />
    )
    const textarea = screen.getByRole('textbox')

    // Trigger error first
    fireEvent.change(textarea, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument()

    // Now fix and apply successfully
    fireEvent.change(textarea, { target: { value: '<HEAT 5><NF><p>' } })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(screen.queryByText(/cannot be empty/i)).toBeNull()
  })
})
