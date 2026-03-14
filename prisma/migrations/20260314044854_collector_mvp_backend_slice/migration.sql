/*
  Warnings:

  - You are about to drop the `Ownership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `provider` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `providerGameId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `gameId` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `storeName` on the `Purchase` table. All the data in the column will be lost.
  - Added the required column `ownershipEntryId` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Ownership_userId_gameId_platform_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Ownership";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OwnershipEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "playStatus" TEXT NOT NULL DEFAULT 'UNPLAYED',
    "editionName" TEXT,
    "region" TEXT,
    "digitalStore" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "acquiredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OwnershipEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OwnershipEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OwnershipEntry_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameProviderRef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "payload" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameProviderRef_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COVER',
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MediaAsset_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "releaseDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Game" ("createdAt", "id", "releaseDate", "title", "updatedAt") SELECT "createdAt", "id", "releaseDate", "title", "updatedAt" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE INDEX "Game_title_idx" ON "Game"("title");
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ownershipEntryId" TEXT NOT NULL,
    "purchasedAt" DATETIME,
    "priceCents" INTEGER,
    "currencyCode" TEXT,
    "vendor" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Purchase_ownershipEntryId_fkey" FOREIGN KEY ("ownershipEntryId") REFERENCES "OwnershipEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("createdAt", "currencyCode", "id", "priceCents", "purchasedAt", "userId") SELECT "createdAt", "currencyCode", "id", "priceCents", "purchasedAt", "userId" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE INDEX "Purchase_userId_purchasedAt_idx" ON "Purchase"("userId", "purchasedAt");
CREATE INDEX "Purchase_ownershipEntryId_createdAt_idx" ON "Purchase"("ownershipEntryId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- CreateIndex
CREATE INDEX "Platform_name_idx" ON "Platform"("name");

-- CreateIndex
CREATE INDEX "OwnershipEntry_userId_createdAt_idx" ON "OwnershipEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OwnershipEntry_userId_platformId_idx" ON "OwnershipEntry"("userId", "platformId");

-- CreateIndex
CREATE INDEX "OwnershipEntry_userId_medium_idx" ON "OwnershipEntry"("userId", "medium");

-- CreateIndex
CREATE INDEX "OwnershipEntry_userId_status_idx" ON "OwnershipEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "OwnershipEntry_userId_gameId_platformId_idx" ON "OwnershipEntry"("userId", "gameId", "platformId");

-- CreateIndex
CREATE INDEX "GameProviderRef_gameId_idx" ON "GameProviderRef"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameProviderRef_provider_externalId_key" ON "GameProviderRef"("provider", "externalId");

-- CreateIndex
CREATE INDEX "MediaAsset_gameId_type_idx" ON "MediaAsset"("gameId", "type");
