// Real-time Order Sync Service
// Handles multi-store order synchronization using polling/WebSocket

export interface StoreSyncConfig {
  storeId: string
  syncInterval: number // milliseconds
  syncTypes: string[] // ['orders', 'customers', 'inventory', 'settings']
}

export interface SyncStatus {
  lastSync: Date | null
  syncInProgress: boolean
  errors: string[]
  syncedItems: {
    orders: number
    customers: number
    inventory: number
    settings: number
  }
}

export interface SyncPayload {
  type: 'order' | 'customer' | 'inventory' | 'setting'
  action: 'create' | 'update' | 'delete'
  storeId: string
  data: any
  timestamp: Date
}

class RealTimeSyncService {
  private syncConfigs: Map<string, StoreSyncConfig> = new Map()
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()
  private syncStatus: Map<string, SyncStatus> = new Map()
  private subscribers: Map<string, Set<(payload: SyncPayload) => void>> = new Map()
  private pendingChanges: Map<string, SyncPayload[]> = new Map()

  configureStoreSync(config: StoreSyncConfig) {
    this.syncConfigs.set(config.storeId, config)
    this.syncStatus.set(config.storeId, {
      lastSync: null,
      syncInProgress: false,
      errors: [],
      syncedItems: { orders: 0, customers: 0, inventory: 0, settings: 0 }
    })
  }

  startSync(storeId: string) {
    const config = this.syncConfigs.get(storeId)
    if (!config) {
      console.error(`No sync config found for store ${storeId}`)
      return
    }

    if (this.syncIntervals.has(storeId)) {
      this.stopSync(storeId)
    }

    const interval = setInterval(() => {
      this.performSync(storeId)
    }, config.syncInterval)

    this.syncIntervals.set(storeId, interval)
    console.log(`Started sync for store ${storeId} every ${config.syncInterval}ms`)
  }

  stopSync(storeId: string) {
    const interval = this.syncIntervals.get(storeId)
    if (interval) {
      clearInterval(interval)
      this.syncIntervals.delete(storeId)
      console.log(`Stopped sync for store ${storeId}`)
    }
  }

  stopAllSync() {
    this.syncIntervals.forEach((_, storeId) => {
      this.stopSync(storeId)
    })
  }

  async performSync(storeId: string): Promise<void> {
    const config = this.syncConfigs.get(storeId)
    if (!config) return

    const status = this.syncStatus.get(storeId)
    if (!status || status.syncInProgress) return

    status.syncInProgress = true

    try {
      const changes = this.getPendingChanges(storeId)

      for (const change of changes) {
        await this.syncChange(change)
        this.notifySubscribers(storeId, change)
      }

      this.clearPendingChanges(storeId)
      status.lastSync = new Date()
      status.errors = []
    } catch (error: any) {
      status.errors.push(error.message || 'Sync failed')
      console.error(`Sync failed for store ${storeId}:`, error)
    } finally {
      status.syncInProgress = false
    }
  }

  async syncOrder(order: any, sourceStoreId: string) {
    const payload: SyncPayload = {
      type: 'order',
      action: 'create',
      storeId: sourceStoreId,
      data: order,
      timestamp: new Date()
    }

    this.addPendingChange(sourceStoreId, payload)
  }

  async syncCustomer(customer: any, sourceStoreId: string) {
    const payload: SyncPayload = {
      type: 'customer',
      action: 'create',
      storeId: sourceStoreId,
      data: customer,
      timestamp: new Date()
    }

    this.addPendingChange(sourceStoreId, payload)
  }

  async syncInventory(itemId: string, quantity: number, sourceStoreId: string) {
    const payload: SyncPayload = {
      type: 'inventory',
      action: 'update',
      storeId: sourceStoreId,
      data: { itemId, quantity },
      timestamp: new Date()
    }

    this.addPendingChange(sourceStoreId, payload)
  }

  subscribe(storeId: string, callback: (payload: SyncPayload) => void): () => void {
    if (!this.subscribers.has(storeId)) {
      this.subscribers.set(storeId, new Set())
    }

    this.subscribers.get(storeId)!.add(callback)

    return () => {
      const callbacks = this.subscribers.get(storeId)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  getSyncStatus(storeId: string): SyncStatus | undefined {
    return this.syncStatus.get(storeId)
  }

  getAllSyncStatuses(): Map<string, SyncStatus> {
    return new Map(this.syncStatus)
  }

  private async syncChange(payload: SyncPayload): Promise<void> {
    // This would make API calls to sync to other stores
    // Implementation depends on your architecture

    switch (payload.type) {
      case 'order':
        await this.syncOrderToStores(payload)
        break
      case 'customer':
        await this.syncCustomerToStores(payload)
        break
      case 'inventory':
        await this.syncInventoryToStores(payload)
        break
      case 'setting':
        await this.syncSettingToStores(payload)
        break
    }
  }

  private async syncOrderToStores(payload: SyncPayload): Promise<void> {
    // Sync order to all other stores
    // In a real implementation, this would make API calls to other stores
    console.log(`Syncing order ${payload.data.orderNumber} to all stores`)
  }

  private async syncCustomerToStores(payload: SyncPayload): Promise<void> {
    console.log(`Syncing customer ${payload.data.name} to all stores`)
  }

  private async syncInventoryToStores(payload: SyncPayload): Promise<void> {
    console.log(`Syncing inventory for item ${payload.data.itemId} to all stores`)
  }

  private async syncSettingToStores(payload: SyncPayload): Promise<void> {
    console.log(`Syncing setting to all stores`)
  }

  private getPendingChanges(storeId: string): SyncPayload[] {
    return this.pendingChanges.get(storeId) || []
  }

  private addPendingChange(storeId: string, payload: SyncPayload): void {
    if (!this.pendingChanges.has(storeId)) {
      this.pendingChanges.set(storeId, [])
    }

    this.pendingChanges.get(storeId)!.push(payload)
  }

  private clearPendingChanges(storeId: string): void {
    this.pendingChanges.set(storeId, [])
  }

  private notifySubscribers(storeId: string, payload: SyncPayload): void {
    const callbacks = this.subscribers.get(storeId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(payload)
        } catch (error) {
          console.error('Error notifying subscriber:', error)
        }
      })
    }
  }
}

export const realTimeSyncService = new RealTimeSyncService()

// Initialize with default sync interval for all stores
export function initializeRealTimeSync(storeId: string) {
  realTimeSyncService.configureStoreSync({
    storeId,
    syncInterval: 30000, // 30 seconds
    syncTypes: ['orders', 'customers', 'inventory', 'settings']
  })
  realTimeSyncService.startSync(storeId)
}
