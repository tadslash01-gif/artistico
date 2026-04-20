const BASE_URL = "https://artistico.love";

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Artistico</title>
</head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 32px;">
              <a href="${BASE_URL}" style="text-decoration:none;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">
                Artistico
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                You received this email because you have an account on
                <a href="${BASE_URL}" style="color:#18181b;">artistico.love</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function primaryButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">${label}</a>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">${label}</td>
    <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Buyer Order Confirmation ────────────────────────────────────────────────

interface BuyerEmailOptions {
  buyerName: string;
  orderId: string;
  productTitle: string;
  amount: number;          // in cents
  productType: string;
  downloadUrl?: string;    // 24-hour signed URL, only for digital products
}

export function buildBuyerConfirmationEmail(opts: BuyerEmailOptions): {
  subject: string;
  html: string;
} {
  const shortId = opts.orderId.slice(0, 8).toUpperCase();

  const deliverySection =
    opts.productType === "digital"
      ? `<p style="margin:16px 0 4px;font-size:15px;color:#111827;font-weight:600;">Your Download</p>
         <p style="margin:0 0 4px;font-size:14px;color:#374151;">Your digital product is ready to download.</p>
         ${
           opts.downloadUrl
             ? primaryButton("⬇ Download Now", opts.downloadUrl)
             : primaryButton("Access My Download", `${BASE_URL}/dashboard/orders`)
         }
         <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">
           ${opts.downloadUrl ? "This link expires in 24 hours. You can" : "You can"} always re-download from
           <a href="${BASE_URL}/dashboard/orders" style="color:#18181b;">My Orders</a>.
         </p>`
      : `<p style="margin:16px 0 4px;font-size:15px;color:#111827;font-weight:600;">Shipping</p>
         <p style="margin:0;font-size:14px;color:#374151;">
           The creator will ship your item and send tracking information. 
           Track your order in <a href="${BASE_URL}/dashboard/orders" style="color:#18181b;">My Orders</a>.
         </p>`;

  const content = `
    <p style="margin:0 0 4px;font-size:24px;">🎉</p>
    <h1 style="margin:8px 0 4px;font-size:20px;font-weight:700;color:#111827;">You just made a creator's day!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hi ${opts.buyerName}, your purchase was successful. Thank you for supporting an independent creator on Artistico.</p>

    <p style="margin:0 0 8px;font-size:15px;color:#111827;font-weight:600;">Order Summary</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tbody>
        ${detailRow("Order ID", `#${shortId}`)}
        ${detailRow("Item", opts.productTitle)}
        ${detailRow("Amount", centsToDollars(opts.amount))}
        ${detailRow("Status", "Paid")}
      </tbody>
    </table>

    ${deliverySection}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
    <p style="margin:0;font-size:13px;color:#6b7280;">
      Need help? Reply to this email or visit our 
      <a href="${BASE_URL}/support" style="color:#18181b;">support page</a>.
    </p>
  `;

  return {
    subject: `Your order is confirmed — ${opts.productTitle}`,
    html: emailWrapper(content),
  };
}

// ─── Creator Sale Notification ───────────────────────────────────────────────

interface CreatorEmailOptions {
  creatorName: string;
  orderId: string;
  productTitle: string;
  amount: number;          // in cents
  creatorPayout: number;   // in cents (95% of amount)
  productType: string;
}

export function buildCreatorSaleEmail(opts: CreatorEmailOptions): {
  subject: string;
  html: string;
} {
  const shortId = opts.orderId.slice(0, 8).toUpperCase();

  const fulfillmentNote =
    opts.productType === "digital"
      ? `<p style="margin:16px 0 0;font-size:14px;color:#374151;">✅ Your digital product was automatically delivered to the buyer.</p>`
      : `<p style="margin:16px 0 0;font-size:14px;color:#374151;">📦 Please ship the item and mark the order as fulfilled in your dashboard.</p>
         ${primaryButton("Fulfill Order", `${BASE_URL}/dashboard/orders`)}`;

  const content = `
    <p style="margin:0 0 4px;font-size:24px;">🛍️</p>
    <h1 style="margin:8px 0 4px;font-size:20px;font-weight:700;color:#111827;">You made a sale!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hi ${opts.creatorName}, someone just purchased your work on Artistico. Here are the details:</p>

    <p style="margin:0 0 8px;font-size:15px;color:#111827;font-weight:600;">Sale Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tbody>
        ${detailRow("Order ID", `#${shortId}`)}
        ${detailRow("Item", opts.productTitle)}
        ${detailRow("Sale Price", centsToDollars(opts.amount))}
        ${detailRow("Platform Fee", centsToDollars(opts.amount - opts.creatorPayout))}
        ${detailRow("Your Payout", `<strong style="color:#16a34a;">${centsToDollars(opts.creatorPayout)}</strong>`)}
      </tbody>
    </table>

    ${fulfillmentNote}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
    <p style="margin:0;font-size:13px;color:#6b7280;">
      View all your sales and payouts in your 
      <a href="${BASE_URL}/dashboard" style="color:#18181b;">Creator Dashboard</a>.
    </p>
  `;

  return {
    subject: `New sale: ${opts.productTitle} — ${centsToDollars(opts.amount)}`,
    html: emailWrapper(content),
  };
}

// ─── New Follower Notification ───────────────────────────────────────────────

interface FollowEmailOptions {
  creatorName: string;
  followerName: string;
  followerProfileUrl: string;
}

export function buildFollowNotificationEmail(opts: FollowEmailOptions): {
  subject: string;
  html: string;
} {
  const content = `
    <p style="margin:0 0 4px;font-size:24px;">👋</p>
    <h1 style="margin:8px 0 4px;font-size:20px;font-weight:700;color:#111827;">You have a new follower!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      Hi ${opts.creatorName}, <strong>${opts.followerName}</strong> just followed you on Artistico.
    </p>
    ${primaryButton("View Their Profile", opts.followerProfileUrl)}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
    <p style="margin:0;font-size:13px;color:#6b7280;">
      Keep creating! Your audience is growing.
    </p>
  `;

  return {
    subject: `${opts.followerName} just followed you on Artistico`,
    html: emailWrapper(content),
  };
}

// ─── Bookmark / Save Notification ────────────────────────────────────────────

interface BookmarkEmailOptions {
  creatorName: string;
  saverName: string;
  projectTitle: string;
  projectUrl: string;
}

export function buildBookmarkNotificationEmail(opts: BookmarkEmailOptions): {
  subject: string;
  html: string;
} {
  const content = `
    <p style="margin:0 0 4px;font-size:24px;">🔖</p>
    <h1 style="margin:8px 0 4px;font-size:20px;font-weight:700;color:#111827;">Someone saved your project!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      Hi ${opts.creatorName}, <strong>${opts.saverName}</strong> just saved your project
      <strong>${opts.projectTitle}</strong>.
    </p>
    ${primaryButton("View Project", opts.projectUrl)}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
    <p style="margin:0;font-size:13px;color:#6b7280;">
      Saves show your work resonates. Keep it up!
    </p>
  `;

  return {
    subject: `${opts.saverName} saved your project "${opts.projectTitle}"`,
    html: emailWrapper(content),
  };
}

// ─── New Review Notification ─────────────────────────────────────────────────

interface ReviewEmailOptions {
  creatorName: string;
  reviewerName: string;
  productTitle: string;
  rating: number;
  reviewTitle: string;
  projectUrl: string;
}

export function buildNewReviewEmail(opts: ReviewEmailOptions): {
  subject: string;
  html: string;
} {
  const stars = "★".repeat(opts.rating) + "☆".repeat(5 - opts.rating);

  const content = `
    <p style="margin:0 0 4px;font-size:24px;">⭐</p>
    <h1 style="margin:8px 0 4px;font-size:20px;font-weight:700;color:#111827;">New review on your product!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      Hi ${opts.creatorName}, <strong>${opts.reviewerName}</strong> left a review on
      <strong>${opts.productTitle}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tbody>
        ${detailRow("Rating", `<span style="color:#f59e0b;">${stars}</span>`)}
        ${detailRow("Title", opts.reviewTitle)}
      </tbody>
    </table>

    ${primaryButton("View Review", opts.projectUrl)}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
    <p style="margin:0;font-size:13px;color:#6b7280;">
      Reviews help other buyers discover your work.
    </p>
  `;

  return {
    subject: `New ${opts.rating}-star review on "${opts.productTitle}"`,
    html: emailWrapper(content),
  };
}

