// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEditorStore } from '../../editor/useEditorStore'
import type { TicketElement } from '../../../../fgl/types'

const sampleText: TicketElement = {
  type: 'text',
  row: 100,
  col: 100,
  font: 3,
  content: 'Hello'
}

const sampleHLine: TicketElement = {
  type: 'hline',
  row: 200,
  col: 100,
  length: 400,
  thickness: 4
}

describe('useEditorStore', () => {
  it('initial document has CONCERT stock', () => {
    const { result } = renderHook(() => useEditorStore())
    expect(result.current.document.stock).toBe('CONCERT')
  })

  it('initial document has no elements', () => {
    const { result } = renderHook(() => useEditorStore())
    expect(result.current.document.elements).toHaveLength(0)
  })

  it('initial selectedIndex is null', () => {
    const { result } = renderHook(() => useEditorStore())
    expect(result.current.selectedIndex).toBeNull()
  })

  it('addElement appends to elements array', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
    })
    expect(result.current.document.elements).toHaveLength(1)
    expect(result.current.document.elements[0]).toEqual(sampleText)
  })

  it('addElement appends multiple elements in order', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
      result.current.addElement(sampleHLine)
    })
    expect(result.current.document.elements).toHaveLength(2)
    expect(result.current.document.elements[1]).toEqual(sampleHLine)
  })

  it('updateElement replaces element at given index', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
    })
    const updated: TicketElement = { ...sampleText, content: 'Updated' }
    act(() => {
      result.current.updateElement(0, updated)
    })
    expect(result.current.document.elements[0]).toEqual(updated)
  })

  it('updateElement does not affect other elements', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
      result.current.addElement(sampleHLine)
    })
    const updated: TicketElement = { ...sampleText, content: 'Changed' }
    act(() => {
      result.current.updateElement(0, updated)
    })
    expect(result.current.document.elements[1]).toEqual(sampleHLine)
  })

  it('removeElement splices the element out', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
      result.current.addElement(sampleHLine)
    })
    act(() => {
      result.current.removeElement(0)
    })
    expect(result.current.document.elements).toHaveLength(1)
    expect(result.current.document.elements[0]).toEqual(sampleHLine)
  })

  it('selectElement sets selectedIndex', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
    })
    act(() => {
      result.current.selectElement(0)
    })
    expect(result.current.selectedIndex).toBe(0)
  })

  it('selectElement(null) deselects', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
      result.current.selectElement(0)
    })
    act(() => {
      result.current.selectElement(null)
    })
    expect(result.current.selectedIndex).toBeNull()
  })

  it('setDocument replaces the entire document', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.setDocument({
        stock: 'CINEMA',
      
        elements: [sampleText]
      })
    })
    expect(result.current.document.stock).toBe('CINEMA')
    expect(result.current.document.elements).toHaveLength(1)
  })

  it('setRawFgl sets document.rawFglOverride to the given string', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.setRawFgl('<HEAT 5><NF><p>')
    })
    expect(result.current.document.rawFglOverride).toBe('<HEAT 5><NF><p>')
  })

  it('setRawFgl(null) clears rawFglOverride', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.setRawFgl('<HEAT 5><NF><p>')
    })
    act(() => {
      result.current.setRawFgl(null)
    })
    expect(result.current.document.rawFglOverride).toBeUndefined()
  })

  it('addElement after setRawFgl clears the override', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.setRawFgl('<HEAT 5><NF><p>')
    })
    act(() => {
      result.current.addElement(sampleText)
    })
    expect(result.current.document.rawFglOverride).toBeUndefined()
  })

  it('updateElement clears rawFglOverride', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
      result.current.setRawFgl('<HEAT 5><NF><p>')
    })
    act(() => {
      result.current.updateElement(0, { ...sampleText, content: 'Changed' })
    })
    expect(result.current.document.rawFglOverride).toBeUndefined()
  })

  it('removeElement clears rawFglOverride', () => {
    const { result } = renderHook(() => useEditorStore())
    act(() => {
      result.current.addElement(sampleText)
      result.current.setRawFgl('<HEAT 5><NF><p>')
    })
    act(() => {
      result.current.removeElement(0)
    })
    expect(result.current.document.rawFglOverride).toBeUndefined()
  })
})
