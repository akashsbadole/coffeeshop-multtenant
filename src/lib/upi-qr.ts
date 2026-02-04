import QRCode from 'qrcode'

export interface UPIQRParams {
  pa: string
  pn?: string
  am?: string
  tn?: string
  note?: string
  cu?: string
  mc?: string
  tr?: string
}

export function generateUPIURL(params: UPIQRParams): string {
  const upiSchema = new URL('upi://pay')

  upiSchema.searchParams.set('pa', params.pa)

  if (params.pn) {
    upiSchema.searchParams.set('pn', params.pn)
  }

  if (params.am) {
    upiSchema.searchParams.set('am', params.am)
  }

  if (params.tn) {
    upiSchema.searchParams.set('tn', params.tn)
  }

  if (params.note) {
    upiSchema.searchParams.set('note', params.note)
  }

  if (params.cu) {
    upiSchema.searchParams.set('cu', params.cu)
  }

  if (params.mc) {
    upiSchema.searchParams.set('mc', params.mc)
  }

  if (params.tr) {
    upiSchema.searchParams.set('tr', params.tr)
  }

  return upiSchema.toString()
}

export async function generateUPIQRCode(
  upiId: string,
  payeeName: string,
  amount: number,
  transactionNote: string,
  transactionRef?: string
): Promise<string> {
  const upiURL = generateUPIURL({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    tn: transactionNote,
    cu: 'INR',
    tr: transactionRef || `TXN_${Date.now()}`
  })

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(upiURL, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateUPIQRCodeSVG(
  upiId: string,
  payeeName: string,
  amount: number,
  transactionNote: string,
  transactionRef?: string
): Promise<string> {
  const upiURL = generateUPIURL({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    tn: transactionNote,
    cu: 'INR',
    tr: transactionRef || `TXN_${Date.now()}`
  })

  try {
    const qrCodeSVG = await QRCode.toString(upiURL, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })

    return qrCodeSVG
  } catch (error) {
    console.error('Error generating QR code SVG:', error)
    throw new Error('Failed to generate QR code SVG')
  }
}

export function parseUPIId(input: string): string {
  let upiId = input.trim().toLowerCase()

  if (upiId.includes('@')) {
    return upiId
  }

  if (!upiId.includes('@')) {
    const upiDomains = [
      '@okhdfcbank',
      '@okicici',
      '@okaxis',
      '@oksbi',
      '@okpaytm',
      '@upi'
    ]

    for (const domain of upiDomains) {
      if (upiId.includes(domain.replace('@', ''))) {
        return '@' + upiId
      }
    }

    return upiId + '@upi'
  }

  return upiId
}

export function isValidUPIId(upiId: string): boolean {
  const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/
  return upiPattern.test(upiId)
}
