-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "winnerId" INTEGER;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
