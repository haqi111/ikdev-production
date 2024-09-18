/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Assuming you have the `anggotaRole.id` value predefined somewhere

  // Create a user with the provided data
  const user = await prisma.users.create({
    data: {
      nra: '1/UKM_IK/XXVII/2024',
      nama: 'SuperAdmin',
      nim: '00000000',
      no_telp: '081252055236',
      email: 'admin@superadmin.com',
      password: '$2a$12$0mzqBvZ50KohsHycEROz6unuu00AhLtDnsQv6/iPmJCCk5.tXNfVG',
      jenis_kelamin: 'MALE',
      agama: 'Kristen',
      image: 'admin.jpg',
      fakultas: 'FTI',
      prodi: 'Informatika',
      angkatan: '2021',
      status: 'Active',
    },
  });

  console.log({ user });
  console.log("Seed data created successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
