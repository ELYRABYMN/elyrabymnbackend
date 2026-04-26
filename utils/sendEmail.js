const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ─── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Logo (root folder mein hai) ──────────────────────────────────────────────
const logoPath = path.join(__dirname, '..', 'logo.png');

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (p, currency = 'PKR') =>
  `${currency} ${Number(p || 0).toLocaleString()}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

const ordNo = (order) =>
  order.orderNumber || String(order._id).toUpperCase().slice(-8);

// ─── Items Table ───────────────────────────────────────────────────────────────
const itemsHTML = (items = [], currency) =>
  items.map(item => `
  <tr>
    <td style="padding:16px 0;border-bottom:1px solid #ede8e0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:58px;vertical-align:top;">
            ${item.image
              ? `<img src="${item.image}" width="50" height="50"
                   style="border-radius:3px;object-fit:cover;display:block;border:1px solid #ede8e0;"/>`
              : `<div style="width:50px;height:50px;background:#f0ebe3;border-radius:3px;"></div>`
            }
          </td>
          <td style="padding-left:14px;vertical-align:top;">
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;
                        letter-spacing:0.02em;margin-bottom:4px;">
              ${item.name || 'Product'}
            </div>
            ${item.size  ? `<div style="font-size:11px;color:#a09080;margin-top:2px;">Size: ${item.size}</div>`  : ''}
            ${item.color ? `<div style="font-size:11px;color:#a09080;margin-top:2px;">Color: ${item.color}</div>` : ''}
            <div style="font-size:11px;color:#a09080;margin-top:2px;">Qty: ${item.quantity || 1}</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
              ${fmt((item.price || 0) * (item.quantity || 1), currency)}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`).join('');

// ─── Totals Block ──────────────────────────────────────────────────────────────
const totalsHTML = (order) => `
  <tr>
    <td style="padding:8px 48px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:13px;color:#a09080;padding-bottom:8px;">Subtotal</td>
          <td style="font-size:13px;color:#a09080;text-align:right;padding-bottom:8px;">
            ${fmt(order.subtotal, order.currency)}
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#a09080;padding-bottom:16px;">Shipping</td>
          <td style="font-size:13px;color:#a09080;text-align:right;padding-bottom:16px;">
            ${Number(order.shipping) > 0 ? fmt(order.shipping, order.currency) : 'Free'}
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #ede8e0;padding-top:14px;
                     font-family:Georgia,serif;font-size:17px;color:#1a1612;">Total</td>
          <td style="border-top:1px solid #ede8e0;padding-top:14px;
                     font-family:Georgia,serif;font-size:17px;color:#1a1612;
                     text-align:right;font-weight:700;">
            ${fmt(order.total, order.currency)}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

// ─── Delivery Details Block ────────────────────────────────────────────────────
const deliveryHTML = (order) => `
  <tr><td style="padding:0 48px 24px;">
    <div style="height:1px;background:#ede8e0;"></div>
  </td></tr>
  <tr>
    <td style="padding:0 48px 24px;">
      <div style="font-size:10px;letter-spacing:0.28em;color:#a09080;
                  text-transform:uppercase;margin-bottom:14px;">Delivery Details</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:50%;vertical-align:top;padding-bottom:12px;">
            <div style="font-size:11px;color:#b0a090;margin-bottom:4px;">Name</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
              ${order.customer.name}
            </div>
          </td>
          <td style="width:50%;vertical-align:top;padding-bottom:12px;">
            <div style="font-size:11px;color:#b0a090;margin-bottom:4px;">Phone</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
              ${order.customer.phone}
            </div>
          </td>
        </tr>
        ${order.customer.address ? `
        <tr>
          <td colspan="2" style="padding-bottom:12px;">
            <div style="font-size:11px;color:#b0a090;margin-bottom:4px;">Delivery Address</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
              ${order.customer.address}${order.customer.city ? `, ${order.customer.city}` : ''}${order.customer.country ? `, ${order.customer.country}` : ''}
            </div>
          </td>
        </tr>` : ''}
        <tr>
          <td colspan="2">
            <div style="font-size:11px;color:#b0a090;margin-bottom:4px;">Payment Method</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a1612;">
              ${order.paymentMethod || 'Cash on Delivery'}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

// ─── Order ID Box ──────────────────────────────────────────────────────────────
const orderBox = (order, badgeColor, badgeText) => `
  <tr>
    <td style="padding:0 48px 28px;">
      <div style="background:#f7f3ed;border:1px solid #e5ddd2;border-radius:2px;
                  padding:20px;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.3em;color:#a09080;
                    text-transform:uppercase;margin-bottom:8px;">Order Reference</div>
        <div style="font-family:Georgia,serif;font-size:22px;color:#1a1612;
                    letter-spacing:0.14em;">${ordNo(order)}</div>
        <div style="font-size:11px;color:#b8a898;margin-top:6px;">${fmtDate(order.createdAt)}</div>
        <div style="display:inline-block;margin-top:12px;padding:5px 18px;
                    background:${badgeColor};color:#fff;font-size:10px;
                    letter-spacing:0.25em;text-transform:uppercase;border-radius:1px;">
          ${badgeText}
        </div>
      </div>
    </td>
  </tr>`;

// ─── Note Box ──────────────────────────────────────────────────────────────────
const noteBox = (text, borderColor = '#c9a96e', bgColor = '#f7f3ed') => `
  <tr>
    <td style="padding:0 48px 40px;">
      <div style="background:${bgColor};border-left:3px solid ${borderColor};
                  padding:16px 18px;border-radius:0 2px 2px 0;">
        <p style="margin:0;font-size:13px;color:#7a6e62;line-height:1.8;">${text}</p>
      </div>
    </td>
  </tr>`;

// ─── Base Email Shell ──────────────────────────────────────────────────────────
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
                    box-shadow:0 2px 32px rgba(0,0,0,0.08);overflow:hidden;">

        <!-- Top Gold Bar -->
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#b8922a,#e2b96a,#b8922a);"></td>
        </tr>

        <!-- Logo -->
        <tr>
          <td style="padding:40px 48px 28px;text-align:center;background:#ffffff;">
            <img src="cid:elyra-logo" alt="Elyra by MN"
                 style="max-width:150px;height:auto;display:block;margin:0 auto 18px;"/>
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
</html>`;

// ══════════════════════════════════════════════════════════════════════════════
//  TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

// 1. Order Received (jab customer order place kare)
const receivedTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✦</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Order Received
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;letter-spacing:0.1em;text-transform:uppercase;">
          Thank you, ${order.customer.name}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#1a1612', 'Received')}
    ${deliveryHTML(order)}
    <tr><td style="padding:0 48px 24px;"><div style="height:1px;background:#ede8e0;"></div></td></tr>
    <tr>
      <td style="padding:0 48px 8px;">
        <div style="font-size:10px;letter-spacing:0.28em;color:#a09080;
                    text-transform:uppercase;margin-bottom:8px;">Your Order</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${itemsHTML(order.items, order.currency)}
        </table>
      </td>
    </tr>
    ${totalsHTML(order)}
    ${noteBox(
      'We have received your order and it will be delivered to you soon. ' +
      'You will be notified at every step of the way. For any queries, feel free to ' +
      'reach us on WhatsApp or reply to this email.'
    )}`;

  return {
    subject: `Order Received — ${ordNo(order)} | Elyra by MN`,
    html: shell(body),
  };
};

// 2. Pending (admin moves to pending)
const pendingTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">⏳</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Order Pending
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;letter-spacing:0.1em;text-transform:uppercase;">
          We have your order, ${order.customer.name}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#8a7a65', 'Pending')}
    ${noteBox(
      'Your order is currently pending review. Our team will look into it shortly and ' +
      'you will receive another update once it has been confirmed. Thank you for your patience.'
    )}`;

  return {
    subject: `Order Pending — ${ordNo(order)} | Elyra by MN`,
    html: shell(body),
  };
};

// 3. Confirmed (admin confirms order)
const confirmedTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✅</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Order Confirmed
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;letter-spacing:0.1em;text-transform:uppercase;">
          Great news, ${order.customer.name}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#2e7d52', 'Confirmed')}
    ${noteBox(
      'Your order has been confirmed and is now being prepared with great care. ' +
      'We will notify you as soon as it is on its way to you. ' +
      'Thank you for choosing Elyra by MN.'
    )}`;

  return {
    subject: `Order Confirmed — ${ordNo(order)} | Elyra by MN`,
    html: shell(body),
  };
};

// 4. Processing (admin marks as processing)
const processingTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">⚙️</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Order Being Prepared
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;letter-spacing:0.1em;text-transform:uppercase;">
          We are getting it ready, ${order.customer.name}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#b8922a', 'Processing')}
    ${noteBox(
      'Your order is currently being processed and carefully packed. ' +
      'This usually takes 1–2 business days. You will receive a shipping ' +
      'notification as soon as your order is dispatched.'
    )}`;

  return {
    subject: `Order Processing — ${ordNo(order)} | Elyra by MN`,
    html: shell(body),
  };
};

// 5. Shipped (admin marks as shipped)
const shippedTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🚚</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Your Order Is On Its Way
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;letter-spacing:0.1em;text-transform:uppercase;">
          Dispatched with care, ${order.customer.name}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#c9a96e', 'Shipped')}
    ${noteBox(
      'Your order has been dispatched and is on its way to you. ' +
      'Please expect delivery within <strong>2–5 business days</strong>. ' +
      'Keep your phone accessible — the courier may call before arrival.'
    )}`;

  return {
    subject: `Your Order Is On Its Way — ${ordNo(order)} | Elyra by MN`,
    html: shell(body),
  };
};

// 6. Delivered (admin marks as delivered)
const deliveredTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🎁</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Delivered with Love
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;letter-spacing:0.1em;text-transform:uppercase;">
          We hope you adore it, ${order.customer.name}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#1a1612', 'Delivered')}
    ${noteBox(
      '<span style="font-family:Georgia,serif;font-size:15px;color:#1a1612;display:block;margin-bottom:8px;">' +
      'Thank you for choosing Elyra by MN.</span>' +
      'Your order has been successfully delivered. We hope it exceeded your expectations. ' +
      'For any concerns, simply reply to this email or reach us on WhatsApp — we are always here for you.'
    )}`;

  return {
    subject: `Delivered — ${ordNo(order)} | Elyra by MN`,
    html: shell(body),
  };
};

// 7. Cancelled (admin cancels order)
const cancelledTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✕</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a1612;letter-spacing:0.06em;">
          Order Cancelled
        </h1>
        <p style="margin:0;font-size:13px;color:#9c8e7e;letter-spacing:0.1em;text-transform:uppercase;">
          We are sorry, ${order.customer.name}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 48px 28px;">
        <div style="background:#fdf5f5;border:1px solid #f0ddd8;border-radius:2px;
                    padding:20px;text-align:center;">
          <div style="font-size:10px;letter-spacing:0.3em;color:#a09080;
                      text-transform:uppercase;margin-bottom:8px;">Order Reference</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#1a1612;
                      letter-spacing:0.14em;">${ordNo(order)}</div>
          <div style="font-size:11px;color:#b8a898;margin-top:6px;">${fmtDate(order.createdAt)}</div>
          <div style="display:inline-block;margin-top:12px;padding:5px 18px;
                      background:#c0392b;color:#fff;font-size:10px;
                      letter-spacing:0.25em;text-transform:uppercase;border-radius:1px;">
            Cancelled
          </div>
        </div>
      </td>
    </tr>
    ${noteBox(
      `Your order <strong>${ordNo(order)}</strong> totalling ` +
      `<strong>${fmt(order.total, order.currency)}</strong> has been cancelled. ` +
      'If this was a mistake or you have any questions, please reach out to us on ' +
      'WhatsApp or reply to this email — we are always happy to help.',
      '#c0392b',
      '#fdf5f5'
    )}
    ${noteBox(
      `We hope to serve you again. Visit us at ` +
      `<a href="${process.env.DOMAIN || '#'}" style="color:#c9a96e;text-decoration:none;">` +
      `${(process.env.DOMAIN || '').replace('https://', '')}</a>`
    )}`;

  return {
    subject: `Order Cancelled — ${ordNo(order)} | Elyra by MN`,
    html: shell(body),
  };
};

// ══════════════════════════════════════════════════════════════════════════════
//  CORE SEND
// ══════════════════════════════════════════════════════════════════════════════
const sendMail = async ({ to, subject, html }) => {
  const attachments = [];

  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'logo.png',
      path: logoPath,
      cid: 'elyra-logo',
    });
  } else {
    console.warn('⚠️  logo.png not found at root — sending without logo');
  }

  await transporter.sendMail({
    from: `"Elyra by MN" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });

  console.log(`✅ Email → ${to} | ${subject}`);
};

// ══════════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

// Called when customer places order
const sendOrderReceivedEmail = async (order) => {
  if (!order?.customer?.email) return;
  const { subject, html } = receivedTemplate(order);
  await sendMail({ to: order.customer.email, subject, html });
};

// Called when admin changes status
const sendStatusUpdateEmail = async (order) => {
  if (!order?.customer?.email) return;

  const map = {
    pending:    pendingTemplate,
    confirmed:  confirmedTemplate,
    processing: processingTemplate,
    shipped:    shippedTemplate,
    delivered:  deliveredTemplate,
    cancelled:  cancelledTemplate,
  };

  const fn = map[order.status];
  if (!fn) return;

  const { subject, html } = fn(order);
  await sendMail({ to: order.customer.email, subject, html });
};

module.exports = { sendOrderReceivedEmail, sendStatusUpdateEmail };