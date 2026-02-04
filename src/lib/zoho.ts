// Zoho Books Integration Service
// Exports financial data to Zoho Books accounting

export interface ZohoConfig {
  organizationId: string
  clientId: string
  clientSecret: string
  redirectUri: string
  accessToken?: string
  refreshToken?: string
}

export interface ZohoInvoice {
  invoiceNumber: string
  customerId?: string
  customerName: string
  invoiceDate: Date
  dueDate: Date
  lineItems: {
    itemId?: string
    name: string
    description?: string
    quantity: number
    rate: number
    taxId?: string
    taxPercentage: number
    taxTotal: number
    itemTotal: number
  }[]
  subTotal: number
  taxTotal: number
  total: number
  paymentMethod?: string
  notes?: string
}

export interface ZohoCustomer {
  name: string
  email?: string
  phone?: string
  gstin?: string
  address?: {
    address: string
    city: string
    state: string
    pincode: string
    country: string
  }
}

export interface ZohoResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

class ZohoBooksService {
  private config: ZohoConfig | null = null
  private baseUrl = 'https://books.zoho.com/api/v3'
  private tokenExpiry: Date | null = null

  configure(config: ZohoConfig) {
    this.config = config
  }

  isEnabled(): boolean {
    return this.config !== null && !!this.config.accessToken
  }

  async getAccessToken(authCode: string): Promise<ZohoResponse> {
    if (!this.config) {
      return { success: false, error: 'Zoho not configured' }
    }

    try {
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: authCode,
          redirect_uri: this.config.redirectUri
        })
      })

      const data = await response.json()

      if (data.error) {
        return { success: false, error: data.error }
      }

      this.config.accessToken = data.access_token
      this.config.refreshToken = data.refresh_token
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000)

      return {
        success: true,
        data: { expiresIn: data.expires_in }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get access token'
      }
    }
  }

  async refreshAccessToken(): Promise<ZohoResponse> {
    if (!this.config || !this.config.refreshToken) {
      return { success: false, error: 'No refresh token available' }
    }

    try {
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken
        })
      })

      const data = await response.json()

      if (data.error) {
        return { success: false, error: data.error }
      }

      this.config.accessToken = data.access_token
      this.config.refreshToken = data.refresh_token
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000)

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to refresh token'
      }
    }
  }

  async createCustomer(customer: ZohoCustomer): Promise<ZohoResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Zoho Books not connected' }
    }

    await this.ensureValidToken()

    try {
      const response = await this.makeRequest('/contacts', 'POST', {
        contact_name: customer.name,
        contact_type: 'customer',
        email: customer.email,
        phone: customer.phone,
        gst_treatment: customer.gstin ? 'business_gst' : 'none',
        gstin: customer.gstin,
        billing_address: customer.address
      })

      if (response.code !== 0) {
        return {
          success: false,
          error: response.message || 'Failed to create customer'
        }
      }

      return {
        success: true,
        data: response.contact
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create customer'
      }
    }
  }

  async createInvoice(invoice: ZohoInvoice): Promise<ZohoResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Zoho Books not connected' }
    }

    await this.ensureValidToken()

    try {
      // First ensure customer exists
      let customerId = invoice.customerId
      if (!customerId) {
        const customerResult = await this.createCustomer({
          name: invoice.customerName,
          gstin: invoice.customerId
        })
        if (customerResult.success) {
          customerId = customerResult.data?.contact_id
        }
      }

      if (!customerId) {
        return { success: false, error: 'Failed to create or find customer' }
      }

      const lineItems = invoice.lineItems.map(item => ({
        item_id: item.itemId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax_id: item.taxId,
        item_total: item.itemTotal
      }))

      const response = await this.makeRequest('/invoices', 'POST', {
        customer_id: customerId,
        invoice_number: invoice.invoiceNumber,
        date: this.formatDate(invoice.invoiceDate),
        due_date: this.formatDate(invoice.dueDate),
        line_items: lineItems,
        sub_total: invoice.subTotal,
        tax_total: invoice.taxTotal,
        total: invoice.total,
        payment_method: invoice.paymentMethod,
        notes: invoice.notes
      })

      if (response.code !== 0) {
        return {
          success: false,
          error: response.message || 'Failed to create invoice'
        }
      }

      return {
        success: true,
        data: response.invoice
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create invoice'
      }
    }
  }

  async getItems(page: number = 1): Promise<ZohoResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Zoho Books not connected' }
    }

    await this.ensureValidToken()

    try {
      const response = await this.makeRequest('/items', 'GET', {
        page
      })

      return {
        success: true,
        data: response.items || []
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch items'
      }
    }
  }

  async testConnection(): Promise<ZohoResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Zoho Books not configured' }
    }

    await this.ensureValidToken()

    try {
      await this.makeRequest('/organizations', 'GET')
      return {
        success: true,
        message: 'Zoho Books connection successful'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Zoho Books'
      }
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const headers: HeadersInit = {
      'Authorization': `Zoho-oauthtoken ${this.config!.accessToken}`,
      'Content-Type': 'application/json'
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (body) {
      options.body = JSON.stringify({
        JSONString: JSON.stringify(body)
      })
    }

    const url = `${this.baseUrl}${this.config!.organizationId}${endpoint}`
    const response = await fetch(url, options)
    return await response.json()
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.refreshAccessToken()
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}

export const zohoBooksService = new ZohoBooksService()
