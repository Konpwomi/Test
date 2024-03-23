import { useEffect, useState } from "react";
import axios from "axios";

// shoes-chelsea-boots ของลด มี size มากกว่า 5 เป็นเลข
// shirts-relaxed-tailored-jacket ขาด colorCode
// shoes-fashionable-high-top-canvas-sneakers ของลด มี size มากกว่า 5 เป็นเลข
// shirts-boxy-tailored-jacket มีครบ
// accessories-classic-leather-crossbody-bag ไม่มี remains

const permalink = "shirts-boxy-tailored-jacket";

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

  // reform json format
  useEffect(() => {
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
        if (currentSize && currentSize.length > 0) {
          // Add size and remaining quantity to the current color's sizes object
          acc[currColor].sizes[currentSize] = {
            remains: currentRemain,
            skuCode: currentSkuCode,
          };
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

  // ใช้ set defaultColor defaultSize เพื่อแสดงผลในการ render ครั้งแรก watch [productsData]
  useEffect(() => {
    // เช็คว่า productsData มีจริงไหม
    if (productsData && Object.keys(productsData).length > 0) {
      let defaultColor = null;
      let defaultSize = null;
      let allColorsOutOfStock = true;

      //วนตลอดทุกสีถ้าสีไหนมี remains เมื่อไหร่ ก็ set defaultColor defaultSize
      for (const color of Object.keys(productsData)) {
        const colorData = productsData[color];
        // เอา key ที่อยู่ภายใน size ทุก key มา filter หา remains ถ้าเจอว่ามี remains เก็บไว้ใน availableSizes
        const availableSizes = Object.keys(colorData.sizes).filter(
          (size) => colorData.sizes[size].remains > 0
        );

        if (availableSizes.length > 0) {
          // เซ็ตสีปัจจุบัน ไซส์ปัจจุบัน เป็น default
          defaultColor = color;
          // ที่เป็น [0] ศูนย์เพราะมาจาก array (.filter)
          defaultSize = availableSizes[0]; //ถ้าไม่เซ็ต size, qty แสดงไม่ถูก
          // พร้อม set allColorsOutOfStock เป็น false
          allColorsOutOfStock = false;
          // เจอสีไหนสีแรกก็ออกเลย
          break;
        }
      }

      // ถ้ามันวนหมดไม่เจอสีไหนมี remains เลยก็จะมา if นี้ต่อ
      // ถ้าของหมดจริง(allColorsOutOfStock) ซึ่ง initail ไว้แล้ว
      if (allColorsOutOfStock && Object.keys(productsData).length > 0) {
        // ให้เสร็จสีเริ่มต้นเป็นสีแรกไปเลย
        defaultColor = Object.keys(productsData)[0];
        // set ให้สี disable เพื่อทำเงื่อนไข render
        setColorDisabled(true); // Disable color selection
      } else {
        setColorDisabled(false); // Enable color selection
      }

      setSelectedColor(defaultColor);
      setSelectedSize(defaultSize);
    }
  }, [productsData]);

  // function เพื่อ set สีตามจาก onclick
  const handleColorChange = (color) => {
    // set สีให้เป็นปัจจุบันตามที่รับค่ามา จากสีที่เรากด
    setSelectedColor(color);
    // set colorData ให้เป็นปัจจุบันตามที่รับค่ามา จากสีที่เรากด
    const colorData = productsData[color];
    // พอสีเป็นปัจจุบันแล้ว ก็มา filter หา sizes ในสีนั้นๆที่มีของ (remains > 0) เก็บทุก size ที่ของไว้ใน availableSizes[]
    const availableSizes = Object.keys(colorData.sizes).filter(
      (size) => colorData.sizes[size].remains > 0
    );

    // จากข้างบนถ้าไม่มีของเลยก็จะเข้าเงื่อนไข
    if (availableSizes.length === 0) {
      // If no sizes are available for the selected color, reset the selected size
      // ซึ่งให้ set เป็น null ไปเลยเพื่อเคสนี่โยงไปถึง qty section เพราะพอ null แล้ว qty ก็ disable เพราะไม่มีอะไรให้ render
      setSelectedSize(null);
      // set disable เพื่อไปทำให้การแสดงผลใน size มันเทาตามเงื่อนไขของเรา
      setSizeDisabled(true);

      // จากข้างบนถ้ามีของ
    } else {
      // set false เพื่อจะได้แสดง choice ได้ตามปกติ
      setSizeDisabled(false);
      // ถ้าไซต์ที่เลือกจากสีก่อน ไม่ได้มีอยู่ในสีใหม่ ให้ set default เป็นตัวแรกของสีใหม่
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
                <div className="lg:flex lg:justify-center">
                  <svg
                    className="h-[15px] w-[15px] text-black lg:h-[36px] lg:w-[36px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 5l-7 7 7 7"
                    />
                  </svg>
                </div>
              </button>
              <button
                className="absolute opacity-60 top-1/2 right-2 p-2 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-700 lg:h-[70px] lg:w-[70px] lg:right-4"
                onClick={nextButton}
              >
                <div className="lg:flex lg:justify-center">
                  <svg
                    className="h-[15px] w-[15px] text-black lg:h-[36px] lg:w-[36px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
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
          <p className="text-lg font-semibold mb-1 lg:text-2lg lg:font-bold lg:mb-4">
            id : {products.skuCode}
          </p>
          <h4 className="text-[40px] font-bold mb-1 lg:text-5lg lg:mb-4">
            {products.name}
          </h4>
          <p className="text-lg font-semibold text-secondary-700 mb-7 lg:text-lg lg:mb-6 lg:text-secondary-s">
            {products.description}
          </p>
          {stock !== 0 && !hasDiscount() && (
            <p className="text-[32px] font-bold mb-7 lg:text-[40px] lg:mb-6">
              THB {products.price}.00
            </p>
          )}
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

          {/* color section */}
          <p className="text-secondary-700">Color</p>
          <div className="flex justify-between mx-10">
            {/* map สี จาก key สีใน object โดยสินค้าเข้าถึง key สีผ่าน Object.keys(productsData) */}
            {Object.keys(productsData).map((color) => {
              {
                /* ได้สีมาไปใส่ productsData[color] เพื่อเก็บค่าทุกอย่างที่อยู่ภายใต้ key ของสีนั้นๆลงใน colorData*/
              }
              const colorData = productsData[color];
              {
                /* เข้าไปหา values ของแต่ละ key(sizes ซึ่งคือ (x,m,l,xl)) ซึ่งจะได้ values ที่อยู่ภายในแต่ละไซส์
               มาเป็น {remains: 0, skuCode: 'C0900611'} จากนั้น .some แล้วจะเข้าไปอีกทีผ่าน
                size ที่เอาไป .remains เพื่อเข้าถึงค่าของที่เหลือ*/
              }
              const hasStock = Object.values(colorData.sizes).some(
                (size) => size.remains > 0
              );
              {
                /* .some ถ้าเจอของอย่างเดียวที่ตรงเงื่อนไง จะคืน ค่า true,false ออกไป */
              }
              return (
                <div
                  className={` ${
                    // isColorDisabled ก็คือ ไม่มีของ out of stock
                    isColorDisabled ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                  // เช็คสองเงื่อนไขเพราะว่า ถ้าเงื่อนไขแรกมันเป็นจริงซึ่งก็คือสีไม่ได้ถูก Disabled ถึงค่อย call handleColorChange(color) ได้
                  // ถ้าไม่เช็คว่ามัน Disabled กดกี่ที call handleColorChange(color) ตลอดซึ่งไม่ดีต่อ performance
                  onClick={() => !isColorDisabled && handleColorChange(color)}
                  key={color}
                >
                  <div
                    // เงื่อนไขเช็คสำหรับใส่กรอบให้ที่ถูกเลือก ถ้าไม่ตรงเงื่อนไง ไม่มีกรอบ (ครั้งแรกที่ render สีแรกนั้นจะมีกรอบเพราะตรง selectedColor)
                    className={` flex w-[54px] h-[54px] border-2 ${
                      // สีที่ออกมาจาก loop ตรงกับ selectedColor ซึ่งคือ default ไหม และ hasStock ก็คือมีของ
                      (selectedColor === color && hasStock) ||
                      // สีที่ออกมาจาก loop ตรงกับ selectedColor ซึ่งคือ default ไหม และ ไม่ ColorDisabled ซึ่งก็คือของไม่หมด
                      (selectedColor === color && !isColorDisabled)
                        ? "border-primary-700"
                        : ""
                    }`}
                    // set สี แต่ละตัวเลือก ให้ตรงกับ colorCode ของมัน
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
                  {/* render ใหม่ตามสีที่ถูก selected จาก handleColorChange(color) หรือ default color (ครั้งแรก)*/}
                  {/*(productsData[selectedColor] syntax นี้ทำให้ได้ของทั้งหมดในภายใต้ [] หรือ key นั้นๆ )
                  "colorCode": "#0000Fl",
                  "sizes": {
                    "S": { remains: 2 },
                    "M": { remains: 1 },
                    "L": { remains: 3 }
                    .sizes เพื่อเข้าถึง key sizes ทั้งหมด แล้ววนด้วย .map */}
                  {Object.keys(productsData[selectedColor].sizes).map(
                    (size) => {
                      //เข้าไปถึงข้อมูลในแต่ละ key ของ sizes { remains: 1 }
                      const sizeData = productsData[selectedColor].sizes[size];
                      //size ไหนไม่มีของ (remains = 0) ก็จะคืนค่า true false ใส่ isDisabled
                      const isDisabled = sizeData.remains === 0;
                      return (
                        <div
                          className={` ${
                            isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                          // เช็คสองเงื่อนไขเพราะว่า ถ้าเงื่อนไขแรกมันเป็นจริงซึ่งก็คือ size ไม่ได้ถูก Disabled ถึงค่อย call handleSizeChange(size) ได้
                          // ถ้าไม่เช็คว่ามัน Disabled กดกี่ที call handleSizeChange(size) ตลอดซึ่งไม่ดีต่อ performance
                          onClick={() => !isDisabled && handleSizeChange(size)}
                          key={size}
                        >
                          <div
                            // ถ้าสีที่เลือก (defalut size) อยู่ไม่ตรงกับ size ที่ถูก render ก็ไม่มี border
                            // จนกว่าจะ render เจอของที่กันถึงจะมี border
                            className={`flex w-[54px] h-[54px] items-center justify-center border ${
                              selectedSize === size ? "border-primary-700" : ""
                            } ${isDisabled ? "bg-gray-300" : ""}`}
                          >
                            <p>{size}</p>
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
                      // ? คือ Optional chaining (ES11) ทำการเช็ค object ที่เราต้องการอ่าน
                      // ว่ามีค่าหรือไม่หากไม่มีก็จะ fallback undefined ให้เราแทนที่จะ throw error
                      Object.values(
                        // ถ้าไม่มีสีถูก select อยู่ (ในกรณีนี้อาจเป็นของหมดทุกสี สีจึงไม่ถูก select)
                        // จะให้ .every ใช้กับ {} แทนเพราะเรามี || รองรับไว้เลยเลื่อมาเป็น {}
                        productsData[selectedColor]?.sizes || {}
                        //every เข้าไปหา remain ของ size ทุก size
                        // (Every คือเมธอดสำหรับทดสอบข้อมูลทุกตัว โดยเมื่อผ่านเงื่อนไขที่กำหนด ทุกค่า จะคืนค่า true หรือ false)
                      ).every((sizeData) => sizeData.remains === 0)
                        ? "bg-gray-300"
                        : ""
                    }`}
                    // เป็นเงื่อนไขเหมือนการแสดงผลเลย ถ้าไม่มีข้อมูลในทุก size (select ตัวนี้ก็จะ disable กดไม่ได้ไป (ได้ค่า ture จาก every))
                    disabled={Object.values(
                      productsData[selectedColor]?.sizes || {}
                    ).every((sizeData) => sizeData.remains === 0)}
                    // value เป็น string เปล่าเพราะ ถ้ามีสีหรือ size ถูกเลือกและ render ใหม่ qty จะได้ล้างค่าตามไปด้วย
                    value={""} // Ensure that the select box value is reset when color or size changes
                    onChange={() => {}} // Prevent selecting a value when disabled
                  >
                    {selectedColor &&
                      selectedSize &&
                      // Array.from พร้อมส่ง Array-like Object เข้าไปเพื่อสร้างอาร์เรย์ใหม่ได้ ในที่นี้คือ length ที่มี
                      // ความยาวตาม condition ตามที่เรากำหนดที่ดึงมาจากข้อมูล
                      Array.from(
                        {
                          length:
                            // ความยาวมีได้ 3 case
                            // productsData[selectedColor].sizes[selectedSize]?.remains
                            // ของมาใน json format ปกติ
                            // productsData[selectedColor]?.remains
                            // ของไม่มี size เข้าถึง remains ได้เลยตามโครงสร้าง reform (แว่น,กระเป๋า)
                            // 0
                            // ของ out of stock
                            productsData[selectedColor].sizes[selectedSize]
                              ?.remains ||
                            productsData[selectedColor]?.remains ||
                            0,
                        },

                        // สมมุติได้ remain ของนี้มา 20 ตัว = index[0,1,2,3...,19]
                        //  = ก็จะ map option จนครบจำนวนข้อมูลซึ่งมี 20 ตัว
                        (_, index) => (
                          <option key={index + 1} value={index + 1}>
                            {index + 1}
                          </option>
                        )
                      )}
                  </select>
                </div>
              </div>
            </div>
          )}
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
