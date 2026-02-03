-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StoreSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "posType" TEXT NOT NULL DEFAULT 'GENERAL',
    "storeName" TEXT NOT NULL DEFAULT 'Universal POS',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "state" TEXT,
    "stateCode" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "startingInvoice" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "logoUrl" TEXT,
    "enableTableManagement" BOOLEAN NOT NULL DEFAULT false,
    "enableKDS" BOOLEAN NOT NULL DEFAULT false,
    "enableSizeVariants" BOOLEAN NOT NULL DEFAULT false,
    "enableColorVariants" BOOLEAN NOT NULL DEFAULT false,
    "enableBarcodes" BOOLEAN NOT NULL DEFAULT false,
    "enableSerialNumbers" BOOLEAN NOT NULL DEFAULT false,
    "enableReturns" BOOLEAN NOT NULL DEFAULT false,
    "enableExchanges" BOOLEAN NOT NULL DEFAULT false,
    "enableLoyaltyProgram" BOOLEAN NOT NULL DEFAULT false,
    "defaultGstRate" TEXT NOT NULL DEFAULT 'EIGHTEEN',
    "gstInclusivePricing" BOOLEAN NOT NULL DEFAULT false,
    "footerText" TEXT,
    "termsConditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StoreSettings" ("accountNumber", "address", "bankName", "createdAt", "currency", "email", "enableBarcodes", "enableColorVariants", "enableExchanges", "enableKDS", "enableLoyaltyProgram", "enableReturns", "enableSerialNumbers", "enableSizeVariants", "enableTableManagement", "gstin", "id", "ifscCode", "invoicePrefix", "logoUrl", "phone", "posType", "startingInvoice", "state", "stateCode", "storeName", "updatedAt") SELECT "accountNumber", "address", "bankName", "createdAt", "currency", "email", "enableBarcodes", "enableColorVariants", "enableExchanges", "enableKDS", "enableLoyaltyProgram", "enableReturns", "enableSerialNumbers", "enableSizeVariants", "enableTableManagement", "gstin", "id", "ifscCode", "invoicePrefix", "logoUrl", "phone", "posType", "startingInvoice", "state", "stateCode", "storeName", "updatedAt" FROM "StoreSettings";
DROP TABLE "StoreSettings";
ALTER TABLE "new_StoreSettings" RENAME TO "StoreSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
