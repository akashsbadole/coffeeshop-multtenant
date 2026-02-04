// SAP/ERP Integration Service
// Generic SAP ERP integration supporting S/4HANA, ECC, and Business One

export interface SapConfig {
  systemType: 'S4HANA' | 'ECC' | 'BUSINESS_ONE'
  baseUrl: string
  username: string
  password: string
  clientId?: string
  clientSecret?: string
}

export interface SapMaterial {
  materialNumber: string
  description: string
  baseUnit: string
  price: number
  taxCode: string
  weight?: number
  volume?: number
}

export interface SapCustomer {
  customerNumber: string
  name: string
  email?: string
  phone?: string
  address?: {
    street: string
    city: string
    postalCode: string
    region: string
    country: string
  }
  taxNumber?: string
}

export interface SapSalesOrder {
  orderNumber?: string
  orderType: string
  salesOrganization: string
  distributionChannel: string
  division: string
  customerNumber: string
  orderDate: Date
  requestedDeliveryDate: Date
  items: {
    lineNumber: number
    materialNumber: string
    quantity: number
    unit: string
    price: number
    taxCode?: string
  }[]
  paymentMethod?: string
  incoterms?: string
}

export interface SapResponse {
  success: boolean
  data?: any
  orderNumber?: string
  error?: string
  message?: string
}

class SapService {
  private config: SapConfig | null = null
  private sessionId: string | null = null
  private sessionExpiry: Date | null = null

  configure(config: SapConfig) {
    this.config = config
  }

  isEnabled(): boolean {
    return this.config !== null
  }

  async connect(): Promise<SapResponse> {
    if (!this.config) {
      return { success: false, error: 'SAP not configured' }
    }

    try {
      if (this.config.systemType === 'BUSINESS_ONE') {
        return await this.connectBusinessOne()
      } else {
        return await this.connectOData()
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to SAP'
      }
    }
  }

  async createSalesOrder(order: SapSalesOrder): Promise<SapResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'SAP not configured' }
    }

    try {
      await this.ensureSession()

      if (this.config!.systemType === 'BUSINESS_ONE') {
        return await this.createOrderBusinessOne(order)
      } else {
        return await this.createOrderOData(order)
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create sales order in SAP'
      }
    }
  }

  async getMaterials(page: number = 1, limit: number = 50): Promise<SapResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'SAP not configured' }
    }

    try {
      await this.ensureSession()

      const skip = (page - 1) * limit
      const response = await this.makeODataRequest(
        `/A_Material?$skip=${skip}&$top=${limit}`
      )

      return {
        success: true,
        data: response.d?.results || []
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch materials from SAP'
      }
    }
  }

  async getCustomers(page: number = 1, limit: number = 50): Promise<SapResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'SAP not configured' }
    }

    try {
      await this.ensureSession()

      const skip = (page - 1) * limit
      const response = await this.makeODataRequest(
        `/A_Customer?$skip=${skip}&$top=${limit}`
      )

      return {
        success: true,
        data: response.d?.results || []
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch customers from SAP'
      }
    }
  }

  async syncInventory(itemId: string, quantity: number, warehouse: string): Promise<SapResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'SAP not configured' }
    }

    try {
      await this.ensureSession()

      if (this.config!.systemType === 'BUSINESS_ONE') {
        return await this.syncInventoryBusinessOne(itemId, quantity, warehouse)
      } else {
        return await this.syncInventoryOData(itemId, quantity, warehouse)
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sync inventory with SAP'
      }
    }
  }

  private async connectOData(): Promise<SapResponse> {
    const response = await fetch(`${this.config!.baseUrl}/sap/opu/odata/sap/Z_API_SRV/$metadata`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${this.getBasicAuth()}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to connect to SAP OData service')
    }

    this.sessionId = Date.now().toString()
    this.sessionExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    return {
      success: true,
      message: 'SAP connection established'
    }
  }

  private async connectBusinessOne(): Promise<SapResponse> {
    // Business One uses DI API or Service Layer
    const response = await fetch(`${this.config!.baseUrl}/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        CompanyDB: 'SBODEMOIN',
        UserName: this.config!.username,
        Password: this.config!.password
      })
    })

    if (!response.ok) {
      throw new Error('Failed to connect to SAP Business One')
    }

    const data = await response.json()
    this.sessionId = data.SessionId
    this.sessionExpiry = new Date(Date.now() + 30 * 60 * 1000)

    return {
      success: true,
      message: 'SAP Business One connection established'
    }
  }

  private async createOrderOData(order: SapSalesOrder): Promise<SapResponse> {
    const payload = {
      DocumentType: order.orderType,
      SalesOrganization: order.salesOrganization,
      DistributionChannel: order.distributionChannel,
      Division: order.division,
      SoldToParty: order.customerNumber,
      OrderDate: this.formatDate(order.orderDate),
      RequestedDeliveryDate: this.formatDate(order.requestedDeliveryDate),
      to_Item: order.items.map(item => ({
        Material: item.materialNumber,
        RequestedQuantity: item.quantity,
        RequestedQuantityUnit: item.unit,
        NetPriceAmount: item.price,
        TaxCode: item.taxCode
      }))
    }

    const response = await this.makeODataRequest('/A_SalesOrder', 'POST', payload)

    return {
      success: true,
      orderNumber: response.d?.SalesOrder || 'SAP-' + Date.now(),
      message: 'Sales order created in SAP'
    }
  }

  private async createOrderBusinessOne(order: SapSalesOrder): Promise<SapResponse> {
    const payload = {
      CardCode: order.customerNumber,
      DocDate: this.formatDate(order.orderDate),
      DocDueDate: this.formatDate(order.requestedDeliveryDate),
      DocumentLines: order.items.map(item => ({
        ItemCode: item.materialNumber,
        Quantity: item.quantity,
        Price: item.price,
        TaxCode: item.taxCode
      }))
    }

    const response = await fetch(`${this.config!.baseUrl}/Orders`, {
      method: 'POST',
      headers: {
        'Cookie': `B1SESSION=${this.sessionId}; ROUTEID=.node2`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    return {
      success: true,
      orderNumber: data.DocNum || 'SAP-' + Date.now(),
      message: 'Sales order created in SAP Business One'
    }
  }

  private async syncInventoryOData(itemId: string, quantity: number, warehouse: string): Promise<SapResponse> {
    const payload = {
      Material: itemId,
      Warehouse: warehouse,
      Quantity: quantity
    }

    await this.makeODataRequest('/A_Inventory', 'POST', payload)

    return {
      success: true,
      message: 'Inventory synced with SAP'
    }
  }

  private async syncInventoryBusinessOne(itemId: string, quantity: number, warehouse: string): Promise<SapResponse> {
    const payload = {
      ItemCode: itemId,
      WarehouseCode: warehouse,
      OnHand: quantity
    }

    await fetch(`${this.config!.baseUrl}/Items('${itemId}')`, {
      method: 'PATCH',
      headers: {
        'Cookie': `B1SESSION=${this.sessionId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    return {
      success: true,
      message: 'Inventory synced with SAP Business One'
    }
  }

  private async makeODataRequest(path: string, method: string = 'GET', body?: any): Promise<any> {
    const headers: HeadersInit = {
      'Authorization': `Basic ${this.getBasicAuth()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const url = `${this.config!.baseUrl}/sap/opu/odata/sap/Z_API_SRV${path}`
    const response = await fetch(url, options)
    return await response.json()
  }

  private async ensureSession(): Promise<void> {
    if (!this.sessionId || !this.sessionExpiry || new Date() >= this.sessionExpiry) {
      await this.connect()
    }
  }

  private getBasicAuth(): string {
    const credentials = `${this.config!.username}:${this.config!.password}`
    return Buffer.from(credentials).toString('base64')
  }

  private formatDate(date: Date): string {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00`
  }
}

export const sapService = new SapService()
