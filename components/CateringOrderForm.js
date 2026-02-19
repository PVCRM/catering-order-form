"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import Image from "next/image";
import { CATERING_MENU, CAFE_INFO } from "@/lib/menuData";
import CateringMenu from "@/components/CateringMenu";
import BankDetails from "@/components/BankDetails";

const inputClass =
  "mt-1 block w-full min-h-[40px] px-3 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-black focus:ring focus:ring-black focus:ring-opacity-50 text-black";
const textareaClass =
  "mt-1 block w-full min-h-[96px] px-3 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-black focus:ring focus:ring-black focus:ring-opacity-50 text-black";
const labelClass = "block text-sm font-medium text-gray-600";

export default function CateringOrderForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime1, setDeliveryTime1] = useState("");
  const [deliveryTime2, setDeliveryTime2] = useState("");
  const [deliveryTime3, setDeliveryTime3] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [invoiceRequired, setInvoiceRequired] = useState("no");
  const [existingAccount, setExistingAccount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [orderItems, setOrderItems] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const updateOrder = (categoryIdx, itemIdx, size, qty) => {
    const key = `${categoryIdx}-${itemIdx}-${size}`;
    setOrderItems((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[key];
        return next;
      }
      next[key] = qty;
      return next;
    });
  };

  const getOrderQty = (categoryIdx, itemIdx, size) => {
    return orderItems[`${categoryIdx}-${itemIdx}-${size}`] || 0;
  };

  const totalAmount = CATERING_MENU.reduce((sum, category, catIdx) => {
    return (
      sum +
      category.items.reduce((catSum, item, itemIdx) => {
        const regularQty = getOrderQty(catIdx, itemIdx, "regular");
        const largeQty = getOrderQty(catIdx, itemIdx, "large");
        return (
          catSum +
          (item.regularPrice || 0) * regularQty +
          (item.largePrice || 0) * largeQty
        );
      }, 0)
    );
  }, 0);

  const buildOrderLines = () => {
    const lines = [];
    Object.entries(orderItems).forEach(([key, qty]) => {
      if (!qty || qty <= 0) return;
      const [catIdx, itemIdx, size] = key.split("-");
      const category = CATERING_MENU[Number(catIdx)];
      if (!category) return;
      const item = category.items[Number(itemIdx)];
      if (!item) return;
      const price =
        size === "regular" ? item.regularPrice || 0 : item.largePrice || 0;
      lines.push({
        categoryName: category.name,
        itemName: item.name,
        size: size === "regular" ? "Regular" : "Large",
        qty,
        price,
      });
    });
    return lines;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    const orderLines = buildOrderLines();

    try {
      const res = await fetch("/api/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          ...(paymentMethod === "card" && {
            cardNumber,
            expiry,
            cvv,
            nameOnCard,
          }),
          orderLines,
          totalAmount,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const msg = `Thank you for your order, ${contactName || "there"}!\n\nYou will receive a confirmation email shortly.`;
      alert(msg);
      window.location.reload();
    } catch (err) {
      const msg = `Could not send order: ${err.message}. Please try again or contact us directly.`;
      setSubmitMessage(msg);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 10;
    const margin = 20;

    doc.setFontSize(20);
    doc.text("Cravings Cafe - Catering Menu", margin, y);
    y += lineHeight * 2;

    doc.setFontSize(12);
    doc.text(CAFE_INFO.address, margin, y);
    y += lineHeight;
    doc.text("Trading hours:", margin, y);
    y += lineHeight;
    CAFE_INFO.tradingHours.forEach((line) => {
      doc.text(line, margin, y);
      y += lineHeight;
    });
    y += lineHeight;

    CATERING_MENU.forEach((category) => {
      doc.setFontSize(16);
      doc.text(category.name, margin, y);
      y += lineHeight;
      category.items.forEach((item) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.text(item.name, margin, y);
        doc.setFontSize(10);
        const regText = `Regular: $${(item.regularPrice || 0).toFixed(2)}`;
        const largeText = `Large: $${(item.largePrice || 0).toFixed(2)}`;
        doc.text(regText, 120, y);
        doc.text(largeText, 160, y);
        if (item.description) {
          y += lineHeight;
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(item.description, 180);
          doc.text(lines, margin, y);
        }
        y += lineHeight * 1.5;
      });
      y += lineHeight;
    });

    y += lineHeight;
    doc.setFontSize(12);
    doc.text("Payment Details:", margin, y);
    y += lineHeight;
    doc.text(CAFE_INFO.payment.bank, margin, y);
    y += lineHeight;
    doc.text(`Account Name: ${CAFE_INFO.payment.accountName}`, margin, y);
    if (CAFE_INFO.payment.bsb) {
      y += lineHeight;
      doc.text(`BSB: ${CAFE_INFO.payment.bsb}`, margin, y);
    }
    if (CAFE_INFO.payment.accountNumber) {
      y += lineHeight;
      doc.text(`Account Number: ${CAFE_INFO.payment.accountNumber}`, margin, y);
    }

    doc.save("cravings-cafe-menu.pdf");
  };

  const minDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Image
            src="/logo.png"
            alt="Cravings Cafe Logo"
            width={220}
            height={96}
            className="h-24 mx-auto mb-4 w-auto"
            priority
          />
          <h1 className="text-4xl font-bold text-black">Cravings Cafe</h1>
          <p className="mt-2 text-lg text-gray-600">Quality Catering Services</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Order Details - exact match to HTML */}
          <div className="border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-2xl font-bold text-black mb-6">
              Order Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Contact Name</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  required
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Street Address</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Suburb</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Postcode</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Delivery Date</label>
                <input
                  type="date"
                  required
                  min={minDate()}
                  className={inputClass}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Delivery Times (specify up to 3 preferred times)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      First Choice (Required)
                    </label>
                    <input
                      type="time"
                      required
                      className={inputClass}
                      value={deliveryTime1}
                      onChange={(e) => setDeliveryTime1(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Second Choice (Optional)
                    </label>
                    <input
                      type="time"
                      className={inputClass}
                      value={deliveryTime2}
                      onChange={(e) => setDeliveryTime2(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Third Choice (Optional)
                    </label>
                    <input
                      type="time"
                      className={inputClass}
                      value={deliveryTime3}
                      onChange={(e) => setDeliveryTime3(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Please provide your preferred delivery times. We&apos;ll
                  confirm the exact time based on availability.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Dietary Requirements/Allergies
                </label>
                <textarea
                  className={textareaClass}
                  placeholder="Please list any dietary requirements or allergies..."
                  value={dietaryRequirements}
                  onChange={(e) => setDietaryRequirements(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Account & Invoice Information - exact match to HTML */}
          <div className="border border-gray-200 rounded-lg p-6 space-y-6">
            <h3 className="text-xl font-semibold text-black mb-6">
              Account & Invoice Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Invoice Required?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none hover:border-black transition-colors">
                    <input
                      type="radio"
                      name="invoice-required"
                      className="sr-only"
                      value="yes"
                      checked={invoiceRequired === "yes"}
                      onChange={(e) => setInvoiceRequired(e.target.value)}
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          Yes
                        </span>
                        <span className="mt-1 text-sm text-gray-500">
                          Invoice required
                        </span>
                      </span>
                    </span>
                    <span
                      className="pointer-events-none absolute -inset-px rounded-lg border-2 border-transparent"
                      aria-hidden="true"
                    />
                  </label>
                  <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none hover:border-black transition-colors">
                    <input
                      type="radio"
                      name="invoice-required"
                      className="sr-only"
                      value="no"
                      checked={invoiceRequired === "no"}
                      onChange={(e) => setInvoiceRequired(e.target.value)}
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          No
                        </span>
                        <span className="mt-1 text-sm text-gray-500">
                          No invoice needed
                        </span>
                      </span>
                    </span>
                    <span
                      className="pointer-events-none absolute -inset-px rounded-lg border-2 border-transparent"
                      aria-hidden="true"
                    />
                  </label>
                </div>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="existing-account"
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    checked={existingAccount}
                    onChange={(e) => setExistingAccount(e.target.checked)}
                  />
                  <label
                    htmlFor="existing-account"
                    className="ml-2 block text-sm font-medium text-gray-600"
                  >
                    Existing Account
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Regular / Large legend - exact match to HTML */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">
                  Regular (Serves 5-7)
                </span>
              </div>
            </div>
            <div className="border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Large (Serves 9-12)</span>
              </div>
            </div>
          </div>

          {/* Menu - CateringMenu component with HTML-matching layout */}
          <CateringMenu
            menu={CATERING_MENU}
            orderItems={orderItems}
            updateOrder={updateOrder}
            getOrderQty={getOrderQty}
          />

          {/* Payment Details - exact match to HTML */}
          <BankDetails
            payment={CAFE_INFO.payment}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            expiry={expiry}
            setExpiry={setExpiry}
            cvv={cvv}
            setCvv={setCvv}
            nameOnCard={nameOnCard}
            setNameOnCard={setNameOnCard}
          />

          {submitMessage && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800 whitespace-pre-line text-black">
              {submitMessage}
            </div>
          )}

          {/* Total & Buttons - exact match to HTML */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center text-xl">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-black font-bold">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex justify-center items-center min-h-[48px] px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </button>
              <button
                type="button"
                onClick={generatePDF}
                className="flex justify-center items-center min-h-[48px] min-w-[180px] px-8 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Download Menu
              </button>
            </div>
          </div>
        </form>

        {/* Terms & Conditions - exact match to HTML */}
        <div className="mt-8 border border-gray-200 p-6 rounded-lg text-sm text-gray-600">
          <h3 className="text-lg font-medium text-black mb-4">
            Terms & Conditions
          </h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Orders must be placed at least 24 hours before scheduled date of
              delivery.
            </li>
            <li>
              We require 24 hours notice for any cancellations or fees may
              apply.
            </li>
            <li>
              Orders must be over $75 to qualify for free delivery, anything
              under $75 may incur a delivery fee.
            </li>
            <li>
              Our Range for free delivery is within a 5km radius of East Perth.
            </li>
            <li>All prices are subject to change without notice.</li>
            <li>
              All credit card payments will attract a 1.5% surcharge fee.
            </li>
            <li>
              Additional charges apply for Gluten Free options - please inquire
              when placing your order.
            </li>
            <li>
              Dietary requirements and allergies must be clearly specified at
              the time of ordering.
            </li>
          </ul>
          <div className="mt-4 text-sm border-t border-gray-200 pt-4">
            <strong className="text-black">CRAVINGS CAFE</strong>
            <br />
            {CAFE_INFO.address}
            <br />
            Trading hours:
            <br />
            Monday – Friday: 6:00 AM – 2:00 PM
            <br />
            Saturday: 7:00 AM – 1:00 PM
          </div>
        </div>
      </div>
    </div>
  );
}
