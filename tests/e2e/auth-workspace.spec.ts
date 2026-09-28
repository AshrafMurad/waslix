import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

const prisma = new PrismaClient();
const runId = randomUUID();
const email = `e2e-${runId}@fixture.waslix.test`;
const password = `Test-${runId}-aA1!`;
const alphaName = `E2E Alpha ${runId}`;
const betaName = `E2E Beta ${runId}`;

test.describe("authentication and workspace smoke", () => {
  test.afterAll(async () => {
    await prisma.workspace.deleteMany({
      where: { slug: { in: [`e2e-alpha-${runId}`, `e2e-beta-${runId}`] } },
    });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  test("protects the shell, signs in, switches workspace, and signs out", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);

    await page.goto("/en/overview");
    await expect(page).toHaveURL(/\/en\/sign-in$/);
    await expect(page.getByLabel("Email")).toHaveValue("admin@example.com");
    await expect(page.getByLabel("Password")).toHaveValue("123456");

    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill(" ");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("This field is required.")).toBeVisible();

    await page.getByLabel("Email").fill("missing@example.com");
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText("The email or password is incorrect."),
    ).toBeVisible();

    const signUpResponse = await request.post("/api/auth/sign-up/email", {
      data: { name: "E2E Admin", email, password },
    });
    expect(signUpResponse.ok()).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const [alpha, beta] = await Promise.all([
      prisma.workspace.create({
        data: {
          name: alphaName,
          slug: `e2e-alpha-${runId}`,
          timezone: "Asia/Riyadh",
          defaultCurrency: "SAR",
        },
      }),
      prisma.workspace.create({
        data: {
          name: betaName,
          slug: `e2e-beta-${runId}`,
          timezone: "UTC",
          defaultCurrency: "USD",
        },
      }),
    ]);
    await prisma.workspaceMember.createMany({
      data: [
        {
          workspaceId: alpha.id,
          userId: user.id,
          role: "ADMIN",
          joinedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          workspaceId: beta.id,
          userId: user.id,
          role: "VIEWER",
          joinedAt: new Date("2026-02-01T00:00:00.000Z"),
        },
      ],
    });
    const alphaMember = await prisma.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId: alpha.id, userId: user.id } },
    });
    const lifecycle = await prisma.lifecycleStage.create({
      data: {
        workspaceId: alpha.id,
        name: "New",
        key: "new",
        position: 0,
      },
    });
    const customer = await prisma.customer.create({
      data: {
        workspaceId: alpha.id,
        name: "E2E Customer",
        currency: "SAR",
        lifecycleStageId: lifecycle.id,
        ownerId: alphaMember.id,
      },
    });

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/overview$/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: `${alphaName} Workspace` }),
    ).toBeVisible();

    await page.goto("/en/customers");
    await expect(
      page.getByRole("heading", { name: "Customers", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "E2E Customer" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "E2E Customer" }).click();
    await expect(page).toHaveURL(new RegExp(`/en/customers/${customer.id}$`));
    await expect(page.getByText("Not enough data").first()).toBeVisible();

    await page.goto(`/en/customers/${customer.id}/health`);
    await expect(page.getByText("Overall health")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Dimension breakdown" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Health inputs" }),
    ).toBeVisible();

    await page.goto(`/ar/customers/${customer.id}/health`);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("الصحة العامة")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "تفصيل الأبعاد" }),
    ).toBeVisible();

    await page.goto("/ar/customers");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("heading", { name: "العملاء", exact: true }),
    ).toBeVisible();

    await page.goto("/en/overview");
    await page.getByRole("button", { name: `${alphaName} Workspace` }).click();
    await page.getByRole("menuitem", { name: betaName }).click();
    await expect(
      page.getByRole("button", { name: `${betaName} Workspace` }),
    ).toBeVisible();

    await page.getByRole("button", { name: /E2E Admin/ }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/en\/sign-in$/);

    await page.goto("/ar/sign-in");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
