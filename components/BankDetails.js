"use client";

const inputClass =
  "mt-1 block w-full min-h-[40px] px-3 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-black focus:ring focus:ring-black focus:ring-opacity-50 text-black";
const labelClass = "block text-sm font-medium text-gray-600";

export default function BankDetails({
  payment,
  paymentMethod,
  setPaymentMethod,
  cardNumber = "",
  setCardNumber,
  expiry = "",
  setExpiry,
  cvv = "",
  setCvv,
  nameOnCard = "",
  setNameOnCard,
}) {

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 2) {
      v = v.slice(0, 2) + "/" + v.slice(2);
    }
    setExpiry(v);
  };

  if (!payment) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-black mb-6">
        Payment Details
      </h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none hover:border-black transition-colors ${
                  paymentMethod === "bank"
                    ? "border-black border-2"
                    : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  className="sr-only"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900">
                      Bank Transfer
                    </span>
                    <span className="mt-1 text-sm text-gray-500">
                      Direct bank transfer
                    </span>
                  </span>
                </span>
                <span
                  className="pointer-events-none absolute -inset-px rounded-lg border-2 border-transparent"
                  aria-hidden="true"
                />
              </label>
              <label
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none hover:border-black transition-colors ${
                  paymentMethod === "card"
                    ? "border-black border-2"
                    : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  className="sr-only"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900">
                      Credit/Debit Card
                    </span>
                    <span className="mt-1 text-sm text-gray-500">
                      Secure card payment
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
        </div>

        {paymentMethod === "bank" && (
          <div className="space-y-2 text-gray-700 border border-gray-200 rounded-lg p-4 bg-gray-50 mt-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Bank Transfer Details
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Bank: {payment.bank}</p>
              <p>Account Name: {payment.accountName}</p>
              {payment.bsb && <p>BSB: {payment.bsb}</p>}
              {payment.accountNumber && (
                <p>Account Number: {payment.accountNumber}</p>
              )}
              <p className="text-gray-500 mt-2">
                Please use your company name as the payment reference
              </p>
            </div>
          </div>
        )}

        {paymentMethod === "card" && (
          <div className="space-y-4 mt-4">
            <div>
              <label className={labelClass}>Card Number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={19}
                placeholder="1234 5678 9012 3456"
                className={inputClass}
                value={cardNumber}
                onChange={handleCardNumberChange}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Expiry Date (MM/YY)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="MM/YY"
                  className={inputClass}
                  value={expiry}
                  onChange={handleExpiryChange}
                />
              </div>
              <div>
                <label className={labelClass}>CVV</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="123"
                  className={inputClass}
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Name on Card</label>
              <input
                type="text"
                placeholder="Name as shown on card"
                className={inputClass}
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-500">
              All credit card payments will attract a 1.5% surcharge.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
