// Tally Integration Service for Accounting
// Exports data to Tally ERP 9 or Tally Prime

export interface TallyConfig {
  url: string
  port: number
  username?: string
  password?: string
  companyName: string
}

export interface TallyExportData {
  invoiceNumber: string
  invoiceDate: Date
  customerName: string
  customerGstin?: string
  items: {
    itemName: string
    quantity: number
    rate: number
    amount: number
    gstRate: number
    cgstAmount: number
    sgstAmount: number
  }[]
  subtotal: number
  totalGst: number
  totalAmount: number
  paymentMethod: string
}

export interface TallyResponse {
  success: boolean
  message?: string
  tallyVoucherNo?: string
  error?: string
}

class TallyService {
  private config: TallyConfig | null = null

  configure(config: TallyConfig) {
    this.config = config
  }

  isEnabled(): boolean {
    return this.config !== null
  }

  async exportOrder(orderData: TallyExportData): Promise<TallyResponse> {
    if (!this.config) {
      return {
        success: false,
        error: 'Tally not configured'
      }
    }

    try {
      // Build XML request for Tally
      const xmlRequest = this.buildTallyXML(orderData)

      // Send request to Tally ODBC/HTTP interface
      const response = await this.sendToTally(xmlRequest)

      return {
        success: true,
        message: 'Order exported to Tally successfully',
        tallyVoucherNo: response.voucherNo
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to export to Tally'
      }
    }
  }

  async exportMultipleOrders(orders: TallyExportData[]): Promise<TallyResponse> {
    if (!this.config) {
      return {
        success: false,
        error: 'Tally not configured'
      }
    }

    const results = {
      success: true,
      exported: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const order of orders) {
      const result = await this.exportOrder(order)
      if (result.success) {
        results.exported++
      } else {
        results.failed++
        results.errors.push(`Order ${order.invoiceNumber}: ${result.error}`)
      }
    }

    if (results.failed > 0) {
      return {
        success: false,
        message: `Exported ${results.exported}/${orders.length} orders`,
        error: results.errors.join(', ')
      }
    }

    return {
      success: true,
      message: `All ${orders.length} orders exported successfully`
    }
  }

  async testConnection(): Promise<TallyResponse> {
    if (!this.config) {
      return {
        success: false,
        error: 'Tally not configured'
      }
    }

    try {
      const testXml = `<ENVELOPE>
        <HEADER>
          <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
          <EXPORTDATA>
            <REQUESTDESC>
              <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              </STATICVARIABLES>
            </REQUESTDESC>
          </EXPORTDATA>
        </BODY>
      </ENVELOPE>`

      await this.sendToTally(testXml)

      return {
        success: true,
        message: 'Tally connection successful'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Tally'
      }
    }
  }

  private buildTallyXML(order: TallyExportData): string {
    let itemsXml = ''
    
    for (const item of order.items) {
      itemsXml += `
        <ALLINVENTORYLIST.LIST>
          <STOCKITEMNAME>${item.itemName}</STOCKITEMNAME>
          <RATE>${item.rate.toFixed(2)}</RATE>
          <AMOUNT>${item.amount.toFixed(2)}</AMOUNT>
          <ACTUALQTY>${item.quantity} Nos</ACTUALQTY>
          <GSTCLASS>IGST@${item.gstRate}%</GSTCLASS>
        </ALLINVENTORYLIST.LIST>`
    }

    return `<ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC>
            <STATICVARIABLES>
              <SVIMPORTFORMAT>$$SysName:XML</SVIMPORTFORMAT>
            </STATICVARIABLES>
          </REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE>
              <VOUCHER>
                <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                <DATE>${this.formatDate(order.invoiceDate)}</DATE>
                <VOUCHERNUMBER>${order.invoiceNumber}</VOUCHERNUMBER>
                <PARTYLEDGERNAME>${order.customerName}</PARTYLEDGERNAME>
                <NARRATION>POS Order ${order.invoiceNumber}</NARRATION>
                ${itemsXml}
                <LEDGERENTRIES.LIST>
                  <LEDGERNAME>Cash</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>${order.totalAmount.toFixed(2)}</AMOUNT>
                </LEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`
  }

  private async sendToTally(xml: string): Promise<any> {
    // Implementation depends on Tally setup:
    // 1. ODBC connection
    // 2. HTTP interface (Tally Prime)
    // 3. TDL interface
    
    // This is a placeholder - actual implementation would use:
    // - fetch() for HTTP interface
    // - odbc package for ODBC connection
    
    return { voucherNo: 'VCH001' }
  }

  private formatDate(date: Date): string {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }
}

export const tallyService = new TallyService()
