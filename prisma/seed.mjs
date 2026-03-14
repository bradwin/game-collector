import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultPlatforms = [
  { slug: "pc", name: "PC", manufacturer: "Various" },
  { slug: "steam", name: "Steam", manufacturer: "Valve" },
  { slug: "playstation-5", name: "PlayStation 5", manufacturer: "Sony" },
  { slug: "nintendo-switch", name: "Nintendo Switch", manufacturer: "Nintendo" },
  { slug: "xbox-series-xs", name: "Xbox Series X|S", manufacturer: "Microsoft" }
];

await Promise.all(
  defaultPlatforms.map((platform) =>
    prisma.platform.upsert({
      where: { slug: platform.slug },
      create: platform,
      update: {
        name: platform.name,
        manufacturer: platform.manufacturer
      }
    })
  )
);

console.log(`Seeded ${defaultPlatforms.length} platforms.`);

await prisma.$disconnect();
