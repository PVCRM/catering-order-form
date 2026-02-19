import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      companyName,
      contactName,
      email,
      phone,
      streetAddress,
      suburb,
      postcode,
      deliveryDate,
      deliveryTime1,
      deliveryTime2,
      deliveryTime3,
      dietaryRequirements,
      invoiceRequired,
      existingAccount,
      paymentMethod,
      cardNumber,
      expiry,
      cvv,
      nameOnCard,
      orderLines,
      totalAmount,
    } = body;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== "false",
      },
    });

    const customerEmail = (email || "").trim();
    const ownerEmail = (process.env.EMAIL_owner || process.env.EMAIL_USER || "").trim();
    const toEmail = ownerEmail || process.env.EMAIL_USER;
    const bccList = customerEmail && customerEmail !== ownerEmail ? [customerEmail] : [];
    const orderList =
      orderLines && orderLines.length > 0
        ? orderLines
            .map(
              (line) =>
                `  • ${line.itemName} (${line.size}): ${line.qty} x $${line.price.toFixed(2)} = $${(line.qty * line.price).toFixed(2)}`
            )
            .join("\n")
        : "  (No items selected)";

    const text = `
NEW CATERING ORDER – Cravings Cafe
=================================

ORDER DETAILS
-------------
Company: ${companyName || "-"}
Contact: ${contactName || "-"}
Email: ${email || "-"}
Phone: ${phone || "-"}

DELIVERY
--------
Address: ${streetAddress || "-"}
Suburb: ${suburb || "-"}
Postcode: ${postcode || "-"}
Date: ${deliveryDate || "-"}
Time 1: ${deliveryTime1 || "-"}
Time 2: ${deliveryTime2 || "-"}
Time 3: ${deliveryTime3 || "-"}

DIETARY / NOTES
---------------
${dietaryRequirements || "-"}

ACCOUNT & INVOICE
-----------------
Invoice required: ${invoiceRequired || "no"}
Existing account: ${existingAccount ? "Yes" : "No"}

PAYMENT
-------
Method: ${paymentMethod === "card" ? "Credit/Debit Card" : "Bank Transfer"}
${paymentMethod === "card" && (cardNumber || expiry || cvv || nameOnCard) ? `
CARD DETAILS
------------
Card Number: ${cardNumber || "-"}
Expiry: ${expiry || "-"}
CVV: ${cvv || "-"}
Name on Card: ${nameOnCard || "-"}
` : ""}

ORDER ITEMS
-----------
${orderList}

TOTAL: $${typeof totalAmount === "number" ? totalAmount.toFixed(2) : "0.00"}
=================================
Sent from Cravings Cafe Catering Order Form
`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Catering Order</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111;">New Catering Order – Cravings Cafe</h1>
  <hr/>
  <h2 style="color: #333;">Order details</h2>
  <p><strong>Company:</strong> ${companyName || "-"}<br/>
  <strong>Contact:</strong> ${contactName || "-"}<br/>
  <strong>Email:</strong> ${email || "-"}<br/>
  <strong>Phone:</strong> ${phone || "-"}</p>

  <h2 style="color: #333;">Delivery</h2>
  <p><strong>Address:</strong> ${streetAddress || "-"}<br/>
  <strong>Suburb:</strong> ${suburb || "-"} <strong>Postcode:</strong> ${postcode || "-"}<br/>
  <strong>Date:</strong> ${deliveryDate || "-"}<br/>
  <strong>Preferred times:</strong> ${deliveryTime1 || "-"} / ${deliveryTime2 || "-"} / ${deliveryTime3 || "-"}</p>

  <h2 style="color: #333;">Dietary / notes</h2>
  <p>${(dietaryRequirements || "-").replace(/\n/g, "<br/>")}</p>

  <h2 style="color: #333;">Account & invoice</h2>
  <p>Invoice required: ${invoiceRequired || "no"} | Existing account: ${existingAccount ? "Yes" : "No"}</p>

  <h2 style="color: #333;">Payment</h2>
  <p>${paymentMethod === "card" ? "Credit/Debit Card" : "Bank Transfer"}</p>
  ${paymentMethod === "card" && (cardNumber || expiry || cvv || nameOnCard) ? `
  <h3 style="color: #333;">Card details</h3>
  <p><strong>Card Number:</strong> ${cardNumber || "-"}<br/>
  <strong>Expiry:</strong> ${expiry || "-"}<br/>
  <strong>CVV:</strong> ${cvv || "-"}<br/>
  <strong>Name on Card:</strong> ${nameOnCard || "-"}</p>
  ` : ""}

  <h2 style="color: #333;">Order items</h2>
  <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${orderLines && orderLines.length > 0 ? orderLines.map((line) => `${line.itemName} (${line.size}): ${line.qty} x $${line.price.toFixed(2)} = $${(line.qty * line.price).toFixed(2)}`).join("\n") : "(No items)"}</pre>

  <p style="font-size: 1.2em;"><strong>Total: $${typeof totalAmount === "number" ? totalAmount.toFixed(2) : "0.00"}</strong></p>
  <hr/>
  <p style="color: #666; font-size: 12px;">Sent from Cravings Cafe Catering Order Form</p>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"Cravings Cafe Orders" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      bcc: bccList.length > 0 ? bccList.join(", ") : undefined,
      replyTo: process.env.EMAIL_USER,
      subject: `Catering Order from ${contactName || companyName || "Customer"} – ${deliveryDate || "TBC"}`,
      text,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send order email error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send email" },
      { status: 500 }
    );
  }
}