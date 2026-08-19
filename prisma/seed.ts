import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

const jobs = [
  {
    title: "Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote",
    description:
      "Build the customer-facing dashboard used by thousands of teams daily. React, TypeScript, a design system you'll help shape.",
  },
  {
    title: "Backend Engineer",
    company: "Kepler Systems",
    location: "Austin, TX",
    description:
      "Own core services powering our billing and usage pipeline. Go and Postgres, high-throughput, low-latency systems.",
  },
  {
    title: "Data Analyst",
    company: "Fathom Analytics",
    location: "Remote",
    description:
      "Turn raw product data into decisions the whole company acts on. SQL-heavy, close partnership with product and growth.",
  },
  {
    title: "Product Designer",
    company: "Rivet Studio",
    location: "New York, NY",
    description:
      "Design end-to-end flows for a small, fast-moving product team. You'll ship from sketch to shipped feature in weeks, not quarters.",
  },
  {
    title: "DevOps Engineer",
    company: "Anchorpoint",
    location: "Remote",
    description:
      "Keep a multi-region infrastructure fast and boring. Terraform, Kubernetes, on-call rotation shared fairly across the team.",
  },
  {
    title: "QA Engineer",
    company: "Northwind Labs",
    location: "Remote",
    description:
      "Build out automated test coverage across our web and API surface, and help the team ship with confidence.",
  },
  {
    title: "Growth Marketer",
    company: "Fathom Analytics",
    location: "Remote",
    description:
      "Run acquisition experiments end to end, from hypothesis to analysis. Comfortable in both spreadsheets and SQL.",
  },
  {
    title: "Mobile Engineer",
    company: "Kepler Systems",
    location: "Austin, TX",
    description:
      "Build and ship features in our iOS and Android apps used by field teams every day. React Native, offline-first.",
  },
];

async function main() {
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  const createdJobs = [];
  for (const job of jobs) {
    createdJobs.push(await prisma.job.create({ data: job }));
  }

  const alicePasswordHash = await bcrypt.hash("password123", 10);
  const bobPasswordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.create({
    data: {
      name: "Alice Chen",
      email: "alice@applyloop.dev",
      passwordHash: alicePasswordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob Ferris",
      email: "bob@applyloop.dev",
      passwordHash: bobPasswordHash,
    },
  });

  const aliceApplication = await prisma.application.create({
    data: {
      userId: alice.id,
      jobId: createdJobs[0].id,
      name: alice.name,
      email: alice.email,
      phone: "555-0102",
      resumeSummary:
        "5 years building React dashboards. Led a design system migration at my last company that cut new-feature build time by a third.",
      essayAnswer1:
        "I've used Northwind's product as a customer and always wanted to work on the dashboard side directly.",
      essayAnswer2:
        "A staging environment was silently drifting from prod. I wrote a nightly diff job that caught it and paged us before it caused an incident.",
    },
  });

  console.log("Seed complete.");
  console.log({
    alice: { id: alice.id, email: alice.email },
    bob: { id: bob.id, email: bob.email },
    aliceApplicationId: aliceApplication.id,
    jobs: createdJobs.map((job) => ({ id: job.id, title: job.title })),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
