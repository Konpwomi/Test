import { useEffect, useState } from "react";
import axios from "axios";

// shoes-chelsea-boots ของลด มี size มากกว่า 5 เป็นเลข
// shirts-relaxed-tailored-jacket ขาด colorCode
// shoes-fashionable-high-top-canvas-sneakers ของลด มี size มากกว่า 5 เป็นเลข
// shirts-boxy-tailored-jacket มีครบ
// accessories-classic-leather-crossbody-bag ไม่มี remains

const permalink = "shoes-chelsea-boots";

function ProductDetail() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stock, setStock] = useState(0);

  //array that create from products used to reformat
  const [skuCode, setSkuCode] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [remains, setRemains] = useState([]);
  const [colorCode, setColorCode] = useState([]);

  //data after reformat
  const [productsData, setProductsData] = useState({});

  // `https://api.storefront.wdb.skooldio.dev/products/${permalink}`
  // `http://localhost:3000/`

  // fetchdata
  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const result = await axios.get(
          `https://api.storefront.wdb.skooldio.dev/products/${permalink}`
        );
        setProducts(result.data);

        const variantSkuCode = result.data.variants.map(
          (variant) => variant.skuCode
        );
        const variantColors = result.data.variants.map(
          (variant) => variant.color
        );
        const variantSizes = result.data.variants.map(
          (variant) => variant.size
        );
        const variantRemains = result.data.variants.map(
          (variant) => variant.remains
        );
        const variantColorCode = result.data.variants.map(
          (variant) => variant.colorCode
        );

        setSkuCode([]);
        setColors([]);
        setSizes([]);
        setRemains([]);
        setColorCode([]);
        setProductsData({});

        setSkuCode(variantSkuCode);
        setColors(variantColors);
        setSizes(variantSizes);
        setRemains(variantRemains);
        setColorCode(variantColorCode);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Check Stock
  useEffect(() => {
    if (remains.length > 0) {
      // Check if remains has data
      const totalStock = remains.reduce(
        (accumulator, current) => accumulator + current,
        0
      );
      setStock(totalStock);
    }
  }, [remains]);

  // Check discount
  const hasDiscount = () => {
    return products.price !== products.promotionalPrice;
  };

  // create data format from array that we got
  useEffect(() => {
    // Example using useEffect for data fetching (optional)
    if (!productsData || Object.keys(productsData).length === 0) {
      // Check if productsData is empty
      const newFormatData = colors.reduce((acc, currColor, index) => {
        const currentSize = sizes[index];
        const currentRemain = remains[index];
        const currentColorCode = colorCode[index];
        const currentSkuCode = skuCode[index]; // New addition

        // Create a new size object if it doesn't exist
        if (!acc[currColor]) {
          acc[currColor] = { sizes: {} };
        }

        // Check if the product has size options
        if (currentSize && currentSize.trim() !== "") {
          // Add size and remaining quantity to the current color's sizes object
          acc[currColor].sizes[currentSize] = {
            remains: currentRemain,
            skuCode: currentSkuCode,
          }; // Include skuCode
        } else {
          // If the product has no size options, directly add remains and colorCode
          acc[currColor].remains = currentRemain;
          acc[currColor].colorCode = currentColorCode;
          acc[currColor].skuCode = currentSkuCode;
        }

        // Add color code to the current color object
        acc[currColor].colorCode = currentColorCode;
        return acc;
      }, {});

      // Sort sizes within the sizes object
      Object.values(newFormatData).forEach((product) => {
        if (product.sizes) {
          product.sizes = Object.fromEntries(
            Object.entries(product.sizes).sort((a, b) => {
              const order = { S: 0, M: 1, L: 2, XL: 3 };
              return order[a[0]] - order[b[0]];
            })
          );
        }
      });

      setProductsData(newFormatData);
    }
  }, [productsData, colors, sizes, remains, colorCode, skuCode]);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isColorDisabled, setColorDisabled] = useState(false);
  const [isSizeDisabled, setSizeDisabled] = useState(false);
  
 // what this fuction do?
  useEffect(() => {
    // Set default color to the first color when productsData is available
    if (productsData && Object.keys(productsData).length > 0) {
      let defaultColor = null;
      let defaultSize = null;
      let allColorsOutOfStock = true;

      for (const color of Object.keys(productsData)) {
        const colorData = productsData[color];
        const availableSizes = Object.keys(colorData.sizes).filter(
          (size) => colorData.sizes[size].remains > 0
        );

        if (availableSizes.length > 0) {
          // If there are available sizes for this color, set it as default
          defaultColor = color;
          defaultSize = availableSizes[0]; // Set default size to the first available size
          allColorsOutOfStock = false;
          break;
        }
      }

      if (allColorsOutOfStock && Object.keys(productsData).length > 0) {
        // If all colors are out of stock, set selectedColor to the first color
        defaultColor = Object.keys(productsData)[0];
        setColorDisabled(true); // Disable color selection
      } else {
        setColorDisabled(false); // Enable color selection
      }

      setSelectedColor(defaultColor);
      setSelectedSize(defaultSize);
    }
  }, [productsData]);

  // Update handleColorChange to correctly set selectedColor and selectedSize
  const handleColorChange = (color) => {
    setSelectedColor(color);
    const colorData = productsData[color];
    const availableSizes = Object.keys(colorData.sizes).filter(
      (size) => colorData.sizes[size].remains > 0
    );

    if (availableSizes.length === 0) {
      // If no sizes are available for the selected color, reset the selected size
      setSelectedSize(null);
      setSizeDisabled(true); // Disable size selection
    } else {
      setSizeDisabled(false); // Enable size selection
      if (!availableSizes.includes(selectedSize)) {
        // If the selected size is not available for the new color
        const defaultSize = availableSizes[0]; // Get the first available size of the new color
        setSelectedSize(defaultSize);
      }
    }
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

  console.log(skuCode);
  console.log(colors);
  console.log(sizes);
  console.log(remains);
  console.log(colorCode);
  console.log(productsData);
  console.log(selectedColor);

  // Button function
  const nextButton = () => {
    const nextIndex = (currentImageIndex + 1) % products.imageUrls.length;
    setCurrentImageIndex(nextIndex);
  };
  // Button function
  const previousButton = () => {
    const prevIndex =
      (currentImageIndex - 1 + products.imageUrls.length) %
      products.imageUrls.length;
    setCurrentImageIndex(prevIndex);
  };

  return (
    <main className="mx-auto lg:max-w-[1600px] lg:min-h-screen">
      {/* Div that wrap the image section and detail section */}
      <div className="mb-20 lg:flex lg:gap-10 lg:mb-[145px]">
        {/* Image section */}
        {isLoading ? (
          <div>Loading product details...</div>
        ) : (
          <div className=" m-4 my-10 lg:basis-1/2 lg:m-0 lg:mt-28">
            {/* Main preview image */}
            <div className="relative grid grid-cols-1">
              {stock == 0 ? (
                <div>
                  <img
                    src={
                      products.imageUrls &&
                      products.imageUrls[currentImageIndex]
                    }
                    alt="Main Product Image"
                    className="w-full object-cover aspect-square brightness-[0.5] lg:max-w-[780px] lg:max-h-[780px]"
                  />
                  <div>
                    <svg
                      width="87"
                      height="26"
                      viewBox="0 0 87 26"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="block absolute top-[14px] right-0 lg:hidden"
                    >
                      <rect
                        width="85.7443"
                        height="25.0654"
                        transform="translate(0.983398 0.0717773)"
                        fill="#222222"
                      />
                      <path
                       fill="white"
                      />
                    </svg>

                    <svg
                      width="193"
                      height="57"
                      viewBox="0 0 87 26"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="lg:block hidden absolute top-[32px] right-0"
                    >
                      <rect
                        width="85.7443"
                        height="25.0654"
                        transform="translate(0.983398 0.0717773)"
                        fill="#222222"
                      />
                      <path
                        fill="white"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <img
                  src={
                    products.imageUrls && products.imageUrls[currentImageIndex]
                  }
                  alt="Main Product Image"
                  className="w-full object-cover aspect-square lg:max-w-[780px] lg:max-h-[780px]"
                />
              )}
              {/* Rendering condition for discount items */}
              {hasDiscount() && (
                <div>
                  <svg
                    width="42"
                    height="26"
                    viewBox="0 0 42 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="block absolute top-[14px] right-0 lg:hidden"
                  >
                    <rect
                      width="40.7443"
                      height="25.0654"
                      transform="translate(0.983398 0.0717773)"
                      fill="#FF000D"
                    />
                    <path
                       fill="white"
                    />
                  </svg>
                  <svg
                    width="91"
                    height="57"
                    viewBox="0 0 42 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="lg:block hidden absolute top-[32px] right-0"
                  >
                    <rect
                      width="40.7443"
                      height="25.0654"
                      transform="translate(0.983398 0.0717773)"
                      fill="#FF000D"
                    />
                    <path
                      fill="white"
                    />
                  </svg>
                </div>
              )}
              {/* Arrow next/Previous button */}
              <button
                className="absolute opacity-60 top-1/2 left-2 p-2 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-700 lg:h-[70px] lg:w-[70px] lg:left-4"
                onClick={previousButton}
              >
              </button>
              {/* Arrow next/Previous button */}
              <button
                className="absolute opacity-60 top-1/2 right-2 p-2 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-700 lg:h-[70px] lg:w-[70px] lg:right-4"
                onClick={nextButton}
              >
              </button>
            </div>

            {/* Thumbnail gallery */}
            <div className="grid grid-cols-4 place-items-center gap-2 mt-4 lg:gap-[31px] lg:mt-[31px]">
              {products.imageUrls &&
                products.imageUrls.slice(1).map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`Product image ${index + 1}`}
                    className={`w-full object-cover aspect-square lg:max-w-[172px] lg:max-h-[172px] cursor-pointer ${
                      stock == 0 && "brightness-[0.7]"
                    } ${
                      index ===
                        (currentImageIndex - 1 + products.imageUrls.length) %
                          products.imageUrls.length &&
                      "border-2 border-primary-700"
                    }`}
                    onClick={() => setCurrentImageIndex(index + 1)} // Adjust index for click handler
                  />
                ))}
            </div>
          </div>
        )}
        
        {/* Detail Section */}
        <div className="mx-4 lg:basis-1/2 lg:mx-0 lg:m-0 lg:mt-28 ">
          {/* ID */}
          <p className="text-lg font-semibold mb-1 lg:text-2lg lg:font-bold lg:mb-4">
            id : {products.skuCode}
          </p>
          {/* Name */}
          <h4 className="text-[40px] font-bold mb-1 lg:text-5lg lg:mb-4">
            {products.name}
          </h4>
          {/* Description */}
          <p className="text-lg font-semibold text-secondary-700 mb-7 lg:text-lg lg:mb-6 lg:text-secondary-s">
            {products.description}
          </p>
          {/* Normal Price */}
          {stock !== 0 && !hasDiscount() && (
            <p className="text-[32px] font-bold mb-7 lg:text-[40px] lg:mb-6">
              THB {products.price}.00
            </p>
          )}
          {/* Out of stock */}
          {stock == 0 && (
            <div>
              <p className="text-[32px] font-bold mb-2 lg:text-[40px] ">
                THB {products.price}.00
              </p>
              <p className="text-danger text-lg font-semibold mb-[24px] lg:text-2xl lg:font-bold">
                Out of stock
              </p>
            </div>
          )}
          {/* Discount price */}
          {hasDiscount() && (
            <div>
              <div className=" inline-block bg-danger mb-2">
                <p className=" inline-block text-[32px] text-white font-bold my-2 mx-[10px] lg:text-[40px]">
                  THB {products.promotionalPrice}.00
                </p>
              </div>
              <p className="text-lg font-semibold mb-[24px]">
                From{" "}
                <span className="line-through ">THB {products.price}.00</span>
              </p>
            </div>
          )}
          {/* Tree option section */}
          <div className="w-[180px] h-[40px] border-2 mb-[54px]"></div>
          {/* color section */}
          <p className="text-secondary-700">Color</p>
          <div className="flex justify-between mx-10">
            {Object.keys(productsData).map((color) => {
              const colorData = productsData[color];
              const hasStock = Object.values(colorData.sizes).some(
                (size) => size.remains > 0
              ); // Check if color has remaining stock
              return (
                <div
                  className={` ${
                    isColorDisabled ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                  onClick={() => !isColorDisabled && handleColorChange(color)}
                  key={color}
                >
                  <div
                    className={` flex w-[54px] h-[54px] border ${
                      (selectedColor === color && hasStock) ||
                      (selectedColor === color && !isColorDisabled)
                        ? "border-primary-700"
                        : ""
                    }`}
                    style={{ backgroundColor: colorData.colorCode }}
                  ></div>
                  <p className="text-md text-gray-700 mt-5">{color}</p>
                </div>
              );
            })}
          </div>
          
          {selectedColor && productsData[selectedColor] && (
            <div>
              {/* Size options */}
              <div>
                <p className="text-secondary-700">Size</p>
                <div className="flex justify-between mx-10">
                  {Object.keys(productsData[selectedColor].sizes).map(
                    (size) => {
                      const sizeData = productsData[selectedColor].sizes[size];
                      const isDisabled = sizeData.remains === 0; // Check if size has no remaining stock
                      return (
                        <div
                          className={`cursor-pointer`}
                          onClick={() => !isDisabled && handleSizeChange(size)}
                          key={size}
                        >
                          <div
                            className={`flex w-[54px] h-[54px] border ${
                              selectedSize === size ? "border-primary-700" : ""
                            } ${isDisabled ? "bg-gray-300" : ""}`}
                          >
                            {size}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Quantity section */}
              <div>
                <p className="text-secondary-700">Qty</p>
                <div>
                  <select
                    className={`border-[1px] h-[54px] w-full pl-[10px] ${
                      Object.values(
                        productsData[selectedColor]?.sizes || {}
                      ).every((sizeData) => sizeData.remains === 0)
                        ? "bg-gray-300"
                        : ""
                    }`}
                    disabled={Object.values(
                      productsData[selectedColor]?.sizes || {}
                    ).every((sizeData) => sizeData.remains === 0)}
                    value={""} // Ensure that the select box value is reset when color or size changes
                    onChange={() => {}} // Prevent selecting a value when disabled
                  >
                    {selectedColor &&
                      selectedSize &&
                      Array.from(
                        {
                          length:
                            productsData[selectedColor].sizes[selectedSize]
                              ?.remains ||
                            productsData[selectedColor]?.remains ||
                            0,
                        },
                        (_, index) => (
                          <option key={index + 1} value={index + 1}>
                            {index + 1}
                          </option>
                        )
                      )}
                  </select>
                  {Object.values(
                    productsData[selectedColor]?.sizes || {}
                  ).every((sizeData) => sizeData.remains === 0) && (
                    <p className="text-xs text-gray-500 mt-1">Out of stock</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* button add to cart */}
          <button className="bg-black w-full h-[54px] text-base text-white mt-10">
            Add to cart
          </button>
        </div>
      </div>
      {/* Another product section */}
      <div className="mx-4 mb-20 lg:md-[64px]">
        <h5 className="text-[31px] font-bold">People also like these</h5>
      </div>
    </main>
  );
}

export default ProductDetail;
