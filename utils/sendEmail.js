const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ─── Transporter ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Logo Path (root folder mein hai) ────────────────────────────────────────
const logoPath = path.join(__dirname, '..', 'logo.png');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (p, currency = 'PKR') =>
  `${currency} ${Number(p || 0).toLocaleString()}`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

// ─── Items Rows HTML ──────────────────────────────────────────────────────────
const buildItemsHTML = (items = [], currency) =>
  items.map(item => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #ede8e0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:58px;vertical-align:top;">
              ${item.image
                ? `<img src="${item.image}" width="50" height="50"
                     style="border-radius:3px;object-fit:cover;display:block;border:1px solid #ede8e0;" />`
                : `<div style="width:50px;height:50px;background:#f0ebe3;border-radius:3px;"></div>`
              }
            </td>
            <td style="padding-left:14px;vertical-align:top;">
              <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;
                          letter-spacing:0.02em;margin-bottom:4px;">
                ${item.name || 'Product'}
              </div>
              ${item.variant
                ? `<div style="font-size:11px;color:#a09080;letter-spacing:0.05em;">
                     Variant: ${item.variant}
                   </div>`
                : ''}
              <div style="font-size:11px;color:#a09080;margin-top:3px;letter-spacing:0.05em;">
                Qty: ${item.quantity || 1}
              </div>
            </td>
            <td style="text-align:right;vertical-align:top;">
              <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
                ${formatPrice((item.price || 0) * (item.quantity || 1), currency)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

// ─── Base Shell ───────────────────────────────────────────────────────────────
const shell = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f0ebe3;
             font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f0ebe3;padding:40px 16px;">
    <tr><td align="center">

      <table width="600" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:2px;
                    box-shadow:0 2px 32px rgba(0,0,0,0.07);overflow:hidden;">

        <!-- Top Gold Bar -->
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#b8922a,#e2b96a,#b8922a);"></td>
        </tr>

        <!-- Logo Header -->
        <tr>
          <td style="padding:40px 48px 28px;text-align:center;background:#ffffff;">
            <img src="cid:elyra-logo" alt="Elyra by MN"
                 style="max-width:150px;height:auto;display:block;margin:0 auto 18px;" />
            <div style="width:36px;height:1px;background:#c9a96e;margin:0 auto;"></div>
          </td>
        </tr>

        ${bodyContent}

        <!-- Footer -->
        <tr>
          <td style="background:#faf7f2;padding:28px 48px;text-align:center;
                     border-top:1px solid #ede8e0;">
            <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;
                        color:#1a1612;text-transform:uppercase;margin-bottom:5px;">
              Elyra by MN
            </div>
            <div style="font-size:11px;color:#b0a090;letter-spacing:0.08em;margin-bottom:10px;">
              Luxury · Curated · Yours
            </div>
            <a href="${process.env.DOMAIN || '#'}"
               style="font-size:11px;color:#c9a96e;text-decoration:none;letter-spacing:0.06em;">
              ${(process.env.DOMAIN || '').replace('https://', '')}
            </a>
            <div style="margin-top:14px;font-size:10px;color:#c8bfb2;">
              © ${new Date().getFullYear()} Elyra by MN. All rights reserved.
            </div>
          </td>
        </tr>

        <!-- Bottom Gold Bar -->
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#b8922a,#e2b96a,#b8922a);"></td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
`;

// ─── Template: Order Confirmation ─────────────────────────────────────────────
const confirmationTemplate = (order) => {
  const {
    _id, customer, items = [], subtotal,
    shipping, total, currency = 'PKR', paymentMethod, createdAt,
  } = order;

  const orderId = String(_id).toUpperCase().slice(-8);

  const body = `
    <!-- Hero -->
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✦</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Order Confirmed
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;
                  letter-spacing:0.1em;text-transform:uppercase;">
          Thank you, ${customer.name}
        </p>
      </td>
    </tr>

    <!-- Order ID Box -->
    <tr>
      <td style="padding:0 48px 28px;">
        <div style="background:#f7f3ed;border:1px solid #e5ddd2;border-radius:2px;
                    padding:20px;text-align:center;">
          <div style="font-size:10px;letter-spacing:0.3em;color:#a09080;
                      text-transform:uppercase;margin-bottom:8px;">Order Reference</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#1a1612;letter-spacing:0.14em;">
            #${orderId}
          </div>
          <div style="font-size:11px;color:#b8a898;margin-top:6px;">${formatDate(createdAt)}</div>
        </div>
      </td>
    </tr>

    <tr><td style="padding:0 48px 24px;"><div style="height:1px;background:#ede8e0;"></div></td></tr>

    <!-- Delivery Details -->
    <tr>
      <td style="padding:0 48px 24px;">
        <div style="font-size:10px;letter-spacing:0.28em;color:#a09080;
                    text-transform:uppercase;margin-bottom:14px;">Delivery Details</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:50%;vertical-align:top;padding-bottom:12px;">
              <div style="font-size:11px;color:#b0a090;margin-bottom:4px;">Name</div>
              <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
                ${customer.name}
              </div>
            </td>
            <td style="width:50%;vertical-align:top;padding-bottom:12px;">
              <div style="font-size:11px;color:#b0a090;margin-bottom:4px;">Phone</div>
              <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
                ${customer.phone}
              </div>
            </td>
          </tr>
          ${customer.address ? `
          <tr>
            <td colspan="2" style="padding-bottom:12px;">
              <div style="font-size:11px;color:#b0a090;margin-bottom:4px;">Delivery Address</div>
              <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
                ${customer.address}${customer.city ? `, ${customer.city}` : ''}${customer.province ? `, ${customer.province}` : ''}
              </div>
            </td>
          </tr>` : ''}
          <tr>
            <td colspan="2">
              <div style="font-size:11px;color:#b0a090;margin-bottom:4px;">Payment Method</div>
              <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
                ${paymentMethod || 'Cash on Delivery'}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr><td style="padding:0 48px 24px;"><div style="height:1px;background:#ede8e0;"></div></td></tr>

    <!-- Items -->
    <tr>
      <td style="padding:0 48px 8px;">
        <div style="font-size:10px;letter-spacing:0.28em;color:#a09080;
                    text-transform:uppercase;margin-bottom:8px;">Your Order</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${buildItemsHTML(items, currency)}
        </table>
      </td>
    </tr>

    <!-- Totals -->
    <tr>
      <td style="padding:8px 48px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:13px;color:#a09080;padding-bottom:8px;">Subtotal</td>
            <td style="font-size:13px;color:#a09080;text-align:right;padding-bottom:8px;">
              ${formatPrice(subtotal, currency)}
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#a09080;padding-bottom:16px;">Shipping</td>
            <td style="font-size:13px;color:#a09080;text-align:right;padding-bottom:16px;">
              ${Number(shipping) > 0 ? formatPrice(shipping, currency) : 'Free'}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #ede8e0;padding-top:14px;
                       font-family:Georgia,serif;font-size:17px;color:#1a1612;">
              Total
            </td>
            <td style="border-top:1px solid #ede8e0;padding-top:14px;
                       font-family:Georgia,serif;font-size:17px;color:#1a1612;
                       text-align:right;font-weight:700;">
              ${formatPrice(total, currency)}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Note -->
    <tr>
      <td style="padding:0 48px 40px;">
        <div style="background:#f7f3ed;border-left:3px solid #c9a96e;
                    padding:16px 18px;border-radius:0 2px 2px 0;">
          <p style="margin:0;font-size:13px;color:#7a6e62;line-height:1.75;">
            Your order is being carefully prepared. We will notify you once it has
            been dispatched. For any queries, feel free to reach us on WhatsApp or
            reply to this email.
          </p>
        </div>
      </td>
    </tr>
  `;

  return { subject: `Order Confirmed — #${orderId} | Elyra by MN`, html: shell(body) };
};

// ─── Template: Shipped ────────────────────────────────────────────────────────
const shippedTemplate = (order) => {
  const { _id, customer } = order;
  const orderId = String(_id).toUpperCase().slice(-8);

  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:40px;margin-bottom:12px;">🚚</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Your Order Is On Its Way
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;
                  letter-spacing:0.1em;text-transform:uppercase;">
          Dispatched with care, ${customer.name}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 48px 28px;">
        <div style="background:#f7f3ed;border:1px solid #e5ddd2;padding:20px;text-align:center;">
          <div style="font-size:10px;letter-spacing:0.3em;color:#a09080;
                      text-transform:uppercase;margin-bottom:8px;">Order Reference</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#1a1612;
                      letter-spacing:0.14em;">#${orderId}</div>
          <div style="display:inline-block;margin-top:12px;padding:5px 18px;
                      background:#c9a96e;color:#fff;font-size:10px;
                      letter-spacing:0.25em;text-transform:uppercase;">Shipped</div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 48px 40px;">
        <div style="background:#f7f3ed;border-left:3px solid #c9a96e;padding:16px 18px;">
          <p style="margin:0;font-size:13px;color:#7a6e62;line-height:1.75;">
            Your order has been dispatched and is on its way to you. Please expect
            delivery within <strong>2–5 business days</strong>. Keep your phone
            accessible — the courier may call before arrival.
          </p>
        </div>
      </td>
    </tr>
  `;

  return { subject: `Your Order Is On Its Way — #${orderId} | Elyra by MN`, html: shell(body) };
};

// ─── Template: Delivered ──────────────────────────────────────────────────────
const deliveredTemplate = (order) => {
  const { _id, customer } = order;
  const orderId = String(_id).toUpperCase().slice(-8);

  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:40px;margin-bottom:12px;">🎁</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Delivered with Love
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;
                  letter-spacing:0.1em;text-transform:uppercase;">
          We hope you adore it, ${customer.name}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 48px 28px;">
        <div style="background:#f7f3ed;border:1px solid #e5ddd2;padding:20px;text-align:center;">
          <div style="font-size:10px;letter-spacing:0.3em;color:#a09080;
                      text-transform:uppercase;margin-bottom:8px;">Order Reference</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#1a1612;
                      letter-spacing:0.14em;">#${orderId}</div>
          <div style="display:inline-block;margin-top:12px;padding:5px 18px;
                      background:#1a1612;color:#c9a96e;font-size:10px;
                      letter-spacing:0.25em;text-transform:uppercase;">Delivered</div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 48px 40px;">
        <div style="background:#f7f3ed;border-left:3px solid #c9a96e;padding:16px 18px;">
          <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:15px;color:#1a1612;">
            Thank you for choosing Elyra by MN.
          </p>
          <p style="margin:0;font-size:13px;color:#7a6e62;line-height:1.75;">
            Your order has been successfully delivered. We hope it exceeded your expectations.
            For any concerns, simply reply to this email or reach us on WhatsApp.
          </p>
        </div>
      </td>
    </tr>
  `;

  return { subject: `Delivered — #${orderId} | Elyra by MN`, html: shell(body) };
};

// ─── Core Send ────────────────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  const attachments = [];

  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'logo.png',
      path: logoPath,
      cid: 'elyra-logo', // referenced as src="cid:elyra-logo" in HTML
    });
  } else {
    console.warn('⚠️  logo.png not found at root — email will send without logo');
  }

  await transporter.sendMail({
    from: `"Elyra by MN" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });

  console.log(`✅ Email sent → ${to} | ${subject}`);
};

// ─── Exports ──────────────────────────────────────────────────────────────────
const sendOrderConfirmation = async (order) => {
  if (!order?.customer?.email) return;
  const { subject, html } = confirmationTemplate(order);
  await sendMail({ to: order.customer.email, subject, html });
};

const sendStatusUpdateEmail = async (order) => {
  if (!order?.customer?.email) return;

  let template = null;
  if (order.status === 'shipped')   template = shippedTemplate(order);
  if (order.status === 'delivered') template = deliveredTemplate(order);
  if (!template) return;

  await sendMail({ to: order.customer.email, ...template });
};

module.exports = { sendOrderConfirmation, sendStatusUpdateEmail };