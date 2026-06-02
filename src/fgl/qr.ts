import QRCode from 'qrcode'

// Returns a 2D boolean matrix where true = dark module.
// Uses error correction level M for a balance of size vs redundancy.
export function generateQRMatrix(content: string): boolean[][] {
  const qr = QRCode.create(content, { errorCorrectionLevel: 'M' })
  const { size, data } = qr.modules
  const matrix: boolean[][] = []
  for (let r = 0; r < size; r++) {
    const row: boolean[] = []
    for (let c = 0; c < size; c++) {
      row.push(data[r * size + c] === 1)
    }
    matrix.push(row)
  }
  return matrix
}

// Returns the rendered dot size for a QR code to fit within maxDots.
export function qrDotSize(content: string, maxDots: number): number {
  const qr = QRCode.create(content, { errorCorrectionLevel: 'M' })
  return Math.floor(maxDots / qr.modules.size)
}
