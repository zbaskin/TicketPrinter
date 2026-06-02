import { useState } from 'react'
import type { TicketDocument, TicketElement } from '../../../fgl/types'

export interface EditorStore {
  document: TicketDocument
  selectedIndex: number | null
  setDocument: (doc: TicketDocument) => void
  addElement: (el: TicketElement) => void
  updateElement: (index: number, el: TicketElement) => void
  removeElement: (index: number) => void
  selectElement: (index: number | null) => void
}

const INITIAL_DOCUMENT: TicketDocument = {
  stock: 'CONCERT',
  heat: 10,
  elements: []
}

export function useEditorStore(): EditorStore {
  const [document, setDocumentState] = useState<TicketDocument>(INITIAL_DOCUMENT)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  function setDocument(doc: TicketDocument): void {
    setDocumentState(doc)
  }

  function addElement(el: TicketElement): void {
    setDocumentState((prev) => ({
      ...prev,
      elements: [...prev.elements, el]
    }))
  }

  function updateElement(index: number, el: TicketElement): void {
    setDocumentState((prev) => ({
      ...prev,
      elements: prev.elements.map((existing, i) => (i === index ? el : existing))
    }))
  }

  function removeElement(index: number): void {
    setDocumentState((prev) => ({
      ...prev,
      elements: prev.elements.filter((_, i) => i !== index)
    }))
  }

  function selectElement(index: number | null): void {
    setSelectedIndex(index)
  }

  return {
    document,
    selectedIndex,
    setDocument,
    addElement,
    updateElement,
    removeElement,
    selectElement
  }
}
