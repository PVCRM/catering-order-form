"use client";

const inputClass =
  "w-full min-h-[40px] px-3 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-black focus:ring focus:ring-black focus:ring-opacity-50 text-black";

export default function CateringMenu({
  menu,
  orderItems,
  updateOrder,
  getOrderQty,
}) {
  return (
    <>
      {menu.map((category, catIdx) => {
        const subtotal = category.items.reduce((sum, item, itemIdx) => {
          const r = getOrderQty(catIdx, itemIdx, "regular");
          const l = getOrderQty(catIdx, itemIdx, "large");
          return (
            sum +
            (item.regularPrice || 0) * r +
            (item.largePrice || 0) * l
          );
        }, 0);

        return (
          <div
            key={catIdx}
            className="border border-gray-200 rounded-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-black">
                {category.name}
              </h3>
              <div className="text-lg font-medium text-gray-600">
                Subtotal: ${subtotal.toFixed(2)}
              </div>
            </div>
            <div className="space-y-6">
              {category.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="border border-gray-200 rounded-lg p-6 transition-all hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium text-black">
                          {item.name}
                        </h4>
                        {item.dietaryInfo && (
                          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {item.dietaryInfo}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="border border-gray-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Regular</span>
                          <span className="text-black">
                            ${(item.regularPrice || 0).toFixed(0)}
                          </span>
                        </div>
                        {item.regularQty && (
                          <div className="text-sm text-gray-600 mb-2">
                            {item.regularQty} pieces
                          </div>
                        )}
                        <input
                          type="number"
                          min={0}
                          className={inputClass}
                          value={getOrderQty(catIdx, itemIdx, "regular")}
                          onChange={(e) =>
                            updateOrder(
                              catIdx,
                              itemIdx,
                              "regular",
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                        />
                      </div>
                      <div className="border border-gray-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Large</span>
                          <span className="text-black">
                            ${(item.largePrice || 0).toFixed(0)}
                          </span>
                        </div>
                        {item.largeQty && (
                          <div className="text-sm text-gray-600 mb-2">
                            {item.largeQty} pieces
                          </div>
                        )}
                        <input
                          type="number"
                          min={0}
                          className={inputClass}
                          value={getOrderQty(catIdx, itemIdx, "large")}
                          onChange={(e) =>
                            updateOrder(
                              catIdx,
                              itemIdx,
                              "large",
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
