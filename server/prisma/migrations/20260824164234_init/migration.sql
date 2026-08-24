-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "otaVersion" TEXT NOT NULL,
    "nativeVersion" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "sha256" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "changelog" TEXT,
    "filePath" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Release_nativeVersion_otaVersion_key" ON "Release"("nativeVersion", "otaVersion");
