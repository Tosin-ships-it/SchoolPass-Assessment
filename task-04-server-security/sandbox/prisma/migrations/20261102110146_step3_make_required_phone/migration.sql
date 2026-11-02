/*
  Warnings:

  - Made the column `phoneNumber` on table `Parent` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Parent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Parent" ("createdAt", "email", "id", "name", "passwordHash", "phoneNumber", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "phoneNumber", "updatedAt" FROM "Parent";
DROP TABLE "Parent";
ALTER TABLE "new_Parent" RENAME TO "Parent";
CREATE UNIQUE INDEX "Parent_email_key" ON "Parent"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
