const Product = require('../models/Product.js');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const base64Img = require('base64-img');
const excel = require('exceljs');
const numeral = require('numeral');


const { sendError, sendSuccess, getToken, sendErrorUnauthorized, formatPriceX } = require ('../utils/methods');


// LIST ALL PRODUCTS
exports.list = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const { pageIndex, pageSize, sort_by, sort_direction, name, category } = req.query;

    console.log("REQ QUERYY", req.query);

    const page = pageIndex;
    const limit = pageSize;
    const sortDirection = sort_direction ? sort_direction.toLowerCase() : undefined;

    let sortPageLimit = {
      page,
      limit
    };

    if (sort_by && sortDirection) {
      sortPageLimit = {
        sort: { [sort_by]: sortDirection },
        page,
        limit,
      };
    }

    let categIds = req.query.category && req.query.category.split(',').map(function(categ) {
      return mongoose.Types.ObjectId(categ);
    });

    const productFieldsFilter = {
      stock: req.query.minimumPrice,
      name: name ? { $regex: name, $options: 'i' } : undefined,
      category: req.query.category ? { $in: categIds } : undefined,
    };


    // Will remove a key if that key is undefined
    Object.keys(productFieldsFilter).forEach(key => productFieldsFilter[key] === undefined && delete productFieldsFilter[key]);

    const filterOptions = [
      { $match: productFieldsFilter },
      { $sort: { createdAt: -1 } },
    ];

    const aggregateQuery = Product.aggregate(filterOptions);

    Product.aggregatePaginate(aggregateQuery, sortPageLimit, (err, result) => {
      if (err) {
        console.log("ERRoRRRRRRRRRRRRRRRRR", err)
        return sendError(res, err, 'Server Failed');
      } else {
        return sendSuccess(res, result);
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }

};



exports.downloadExcel = async (req, res) => {
  const { productList, fomattedDateNow } = req.body;

  try {
    // Create a new workbook
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Add an image to the worksheet
    const imageLink = path.join(__dirname, '../templates/snapstocklogo.png');
    const imageId = workbook.addImage({
      filename: imageLink,
      extension: 'png',
    });
    worksheet.addImage(imageId, 'A1:A4'); // Adjust the cell range as needed

    const titileRow =worksheet.addRow(['Products report:', '', fomattedDateNow]);
    titileRow.font = { bold: true, size: 14 };
    titileRow.getCell(3).alignment = { horizontal: 'right' };
    worksheet.addRow([]);

    // Add headers to the worksheet with bold font
    const headerRow = worksheet.addRow(['Name', 'Stock', 'Price']);
    headerRow.font = { bold: true };
    headerRow.getCell(3).alignment = { horizontal: 'right' };

    // Add data to the worksheet
    productList.forEach((product) => {
      const { name, stocks, price} = product;
      const formattedPrice = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price);

      // Add rows with specified alignment for "Stock" and "Price" columns
      const row = worksheet.addRow([name, stocks, formattedPrice]);
      row.getCell(2).alignment = { horizontal: 'left' };  // Align "Stock" to the left
      row.getCell(3).alignment = { horizontal: 'right' }; // Align "Price" to the right
    });


    // Adjust the width of the columns
    worksheet.columns.forEach((column) => {
      column.width = 50; // Adjust the width as needed
    });


    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename=Product_Inventory_Report_${fomattedDateNow}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the workbook as the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    // Handle errors
    console.error('Error generating Excel report:', error);
    res.status(500).json({
      success: false,
      error,
      message: 'Error generating Excel report.',
    });
  }
};



exports.downloadPDF = async (req, res, next) => {
  const { productList, fomattedDateNow } = req.body;

  const formattedProductList = productList.map(product => ({
    ...product,
    price: formatPriceX(product.price), // Format total with peso sign
  }));

  try {
    // Construct the full path to the image
    const imagePath = path.join(__dirname, '../templates/snapstocklogo.png');

    // Convert image to base64
    const logoBase64 = await new Promise((resolve, reject) => {
      base64Img.base64(imagePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    // Construct the full path to the HTML template
    const templatePath = path.join(__dirname, '../templates/productsPdfTemplete.html');

    // Read the HTML template
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');

    // Compile the HTML template using Handlebars
    const template = handlebars.compile(templateHtml);

    // Use the template to generate HTML with formatted prices
    const html = template({
      productList: formattedProductList,
      fomattedDateNow,
      logoBase64,
    });

    // Launch a headless browser
    const browser = await puppeteer.launch({
      executablePath: 'google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set the HTML content of the page
    await page.setContent(html);

    // Generate PDF
    const pdfBuffer = await page.pdf({ format: 'A4' });

    // Close the browser
    await browser.close();

    // Respond with success
    res.setHeader('Content-Disposition', `attachment; filename=Product_Inventory_Report_${fomattedDateNow}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).send(pdfBuffer);

  } catch (error) {
    // Handle errors
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error,
      message: 'Error generating PDF report.',
    });
  }
};





//CREATE PRODUCT
exports.add = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    // Capitalize the first letter of the "name" field in the request body
    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const capitalizedName = capitalizeFirstLetter(req.body.name);

    Product.create({ ...req.body, name: capitalizedName }, function (err, product) {
      if (err) {
        return sendError(res, err, 'Add product failed');
      } else {
        return sendSuccess(res, product);
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};







//GET BY ID
exports.getById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Product.findById(req.params.id, function (err, prod) {
      if (err || !prod) {
        return sendError(res, err, 'Cannot get product')
      } else {
        return sendSuccess(res, prod)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}






//UPDATE BY ID
exports.updateById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    // Capitalize the first letter of the "name" field in the request body
    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const capitalizedName = capitalizeFirstLetter(req.body.name);

    Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, name: capitalizedName },
      { new: true },
      function (err, updatedProduct) {
        if (err || !updatedProduct) {
          return sendError(res, err, 'Cannot update product');
        } else {
          console.log("REQ BODYYYYYYYYYYYYYY", req.body);
          return sendSuccess(res, updatedProduct, 'Product updated successfully');
        }
      }
    );
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};







//DELETE BY ID
exports.deleteById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Product.findByIdAndRemove(req.params.id, req.body, function (err, product) {
      if (err || !product) {
        return sendError(res, {}, 'Cannot delete product');
      } else {
        return sendSuccess(res, product, 'Product deleted successfully.');
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}


//ADD QUANTITY IN PRODUCTS
exports.addQuantityOfProds = (req, res, next) => {
  /*let token = getToken(req.headers);
  if (token) {
    console.log("TOKEN???", token)
    Product.findById(req.params.id, function (err, prod) {
      if (err || !prod) {
        return sendError(res, err, 'Cannot get product')
      } else {
        prod.stocks = prod.stocks + req.body.addedStocks;
        prod.save();

        return sendSuccess(res, prod)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }*/
  console.log("GETTING THIS FUNCTION?????????? ADDING QUANTITY")
  Product.findById(req.params.id, function (err, prod) {
    if (err || !prod) {
      return sendError(res, err, 'Cannot get product')
    } else {
      prod.stocks = prod.stocks + req.body.addedStocks;
      prod.save();

      return sendSuccess(res, prod)
    }
  });
}
