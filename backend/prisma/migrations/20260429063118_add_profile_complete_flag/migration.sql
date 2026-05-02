-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "profileComplete" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "specialization" DROP NOT NULL,
ALTER COLUMN "experience" DROP NOT NULL,
ALTER COLUMN "rating" SET DEFAULT 0,
ALTER COLUMN "avatar" DROP NOT NULL,
ALTER COLUMN "available" SET DEFAULT true,
ALTER COLUMN "department" DROP NOT NULL,
ALTER COLUMN "fee" SET DEFAULT 0,
ALTER COLUMN "nextAvailable" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EmergencyRequest" ADD COLUMN     "nearbyHospitals" JSONB;
