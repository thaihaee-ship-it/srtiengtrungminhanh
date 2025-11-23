import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Tao tai khoan Admin mac dinh
  const adminEmail = "admin@eduapp.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Administrator",
        role: "ADMIN",
      },
    });

    console.log("Da tao tai khoan Admin:");
    console.log("  Email: admin@eduapp.com");
    console.log("  Password: admin123");
  } else {
    console.log("Tai khoan Admin da ton tai");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
