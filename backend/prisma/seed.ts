import { prisma } from "../src/lib/prisma";
import type { Priority, Status } from "../src/types/ticket";

type SeedTicket = [title: string, description: string, email: string, priority: Priority, status: Status, hoursAgo: number];

// Deterministic data: 10 tickets per status, every status/priority combination present.
const SEED_TICKETS: SeedTicket[] = [
  // OPEN
  ["Unable to login after password reset", "Customer reset their password but the new credentials are rejected with 'invalid login'.", "maya.chen@northwind.io", "HIGH", "OPEN", 3],
  ["Payment failed but card was charged", "Checkout showed a payment error, yet the bank statement shows the charge was taken.", "daniel.okafor@brightpay.co", "HIGH", "OPEN", 7],
  ["Checkout page returns 500 error", "Several customers report a server error when submitting their cart since this morning.", "priya.nair@greenleaf.in", "HIGH", "OPEN", 20],
  ["Account locked after multiple login attempts", "User was locked out after three failed login attempts and the unlock email never arrived.", "tomas.silva@lumenlabs.com", "HIGH", "OPEN", 41],
  ["Invoice PDF shows wrong billing address", "The downloaded invoice lists the old office address instead of the updated one.", "sarah.mitchell@harborfreight.com", "MEDIUM", "OPEN", 55],
  ["Cannot update notification email", "The 'Save' button on the notification settings page does nothing for this account.", "kenji.watanabe@sakuraweb.jp", "MEDIUM", "OPEN", 90],
  ["Dashboard charts load slowly", "Usage charts take over 15 seconds to render for workspaces with more than 50 users.", "amelia.rossi@vertexgroup.it", "MEDIUM", "OPEN", 130],
  ["Request: dark mode for the admin panel", "Our support team works night shifts and would like a dark theme for the admin panel.", "liam.oconnor@kestrel.ie", "LOW", "OPEN", 170],
  ["Typo in the welcome email", "The welcome email says 'Wellcome aboard'. Small thing, but it is the first thing new users see.", "fatima.alhassan@zenith.ng", "LOW", "OPEN", 240],
  ["Add CSV export to reports", "We would like to download the monthly report as CSV to analyse it in our own tools.", "noah.kim@pinecrest.dev", "LOW", "OPEN", 310],

  // IN_PROGRESS
  ["Two-factor codes not arriving by SMS", "Customers in France are not receiving 2FA text messages; email codes still work.", "olivia.dubois@maisonverte.fr", "HIGH", "IN_PROGRESS", 12],
  ["Payment webhook delivered twice", "Our system received the payment.succeeded webhook two times for the same order.", "rahul.mehta@payflow.in", "HIGH", "IN_PROGRESS", 30],
  ["Data sync with Salesforce stalls overnight", "The nightly sync stops at around 40% and has to be restarted manually every morning.", "grace.thompson@alderwood.org", "HIGH", "IN_PROGRESS", 66],
  ["Mobile app crashes when uploading photos", "The Android app closes immediately when attaching more than three photos to a request.", "lucas.ferreira@rotaviva.br", "MEDIUM", "IN_PROGRESS", 100],
  ["Search results ignore accented characters", "Searching for 'café' does not return items titled 'Cafe' and vice versa.", "elena.petrova@nordlicht.de", "MEDIUM", "IN_PROGRESS", 150],
  ["SSO login redirects to a blank page", "After authenticating with our identity provider the user lands on an empty white page.", "ethan.walker@copperline.com", "MEDIUM", "IN_PROGRESS", 200],
  ["Coupon code not applied at checkout", "Valid coupon SPRING20 is accepted but the discount does not appear in the order total.", "mia.johansson@nordic-home.se", "MEDIUM", "IN_PROGRESS", 230],
  ["Update logo in email footer", "Please replace the old logo in transactional email footers with the new brand assets.", "hannah.berg@fjordworks.no", "LOW", "IN_PROGRESS", 260],
  ["Improve error message on failed import", "The import wizard only says 'Something went wrong'. It should say which row failed.", "ibrahim.khalil@oasisretail.ae", "LOW", "IN_PROGRESS", 330],
  ["Clarify rate limits in API docs", "The docs do not mention the per-minute rate limit, which we hit during integration.", "chloe.martin@bluebay.ca", "LOW", "IN_PROGRESS", 400],

  // RESOLVED
  ["Password reset email lands in spam", "All reset emails to our company domain end up in the spam folder.", "jack.bennett@riverstone.com", "HIGH", "RESOLVED", 48],
  ["Duplicate charge on annual plan", "We were billed twice for the annual subscription renewal. Refund requested.", "ananya.iyer@lotusdigital.in", "HIGH", "RESOLVED", 120],
  ["Login page unreachable from Safari", "The login page spins forever on Safari 17 while Chrome and Firefox work fine.", "mateo.garcia@solmar.es", "HIGH", "RESOLVED", 210],
  ["Wrong timezone shown on audit log", "Audit log entries show UTC instead of the workspace timezone (Australia/Sydney).", "sophie.laurent@lumiere.fr", "MEDIUM", "RESOLVED", 280],
  ["Cannot remove team member from workspace", "The 'Remove' option is greyed out for a former employee in the members list.", "oliver.nguyen@tidewater.au", "MEDIUM", "RESOLVED", 350],
  ["Export times out on large datasets", "Exporting more than 100k rows fails with a gateway timeout after one minute.", "zara.ahmed@crescent.pk", "MEDIUM", "RESOLVED", 420],
  ["Broken link in the onboarding guide", "Step 4 of the onboarding guide links to a page that returns 404.", "henry.clarke@oakhurst.co.uk", "LOW", "RESOLVED", 480],
  ["Rename 'Projects' tab to 'Workspaces'", "To match our internal wording we would like the tab label to be customisable.", "isabella.costa@mar-azul.pt", "LOW", "RESOLVED", 540],
  ["Update VAT number on invoices", "Please change the VAT number on all future invoices. New number attached to the account.", "felix.wagner@alpenblick.at", "LOW", "RESOLVED", 610],
  ["Currency symbol missing in payment summary", "The payment summary shows 49.00 without the currency symbol for EUR accounts.", "nina.kowalski@polaris.pl", "LOW", "RESOLVED", 690],
];

async function main() {
  const reset = process.argv.includes("--reset");
  const existing = await prisma.ticket.count();

  if (existing > 0 && !reset) {
    console.log(`Database already has ${existing} tickets - seed skipped. Run "npm run db:reseed" to replace them.`);
    return;
  }

  const now = Date.now();
  const data = SEED_TICKETS.map(([title, description, customerEmail, priority, status, hoursAgo]) => {
    const createdAt = new Date(now - hoursAgo * 60 * 60 * 1000);
    // Resolved/in-progress tickets were touched after creation
    const updatedAt = status === "OPEN" ? createdAt : new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    return { title, description, customerEmail, priority, status, createdAt, updatedAt };
  });

  await prisma.$transaction([prisma.ticket.deleteMany(), prisma.ticket.createMany({ data })]);
  console.log(`Seeded ${data.length} tickets.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
