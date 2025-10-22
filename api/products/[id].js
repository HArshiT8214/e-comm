const productService = require('../../backend/src/services/productService');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      const result = await productService.getProductById(id);
      res.json(result);
    } else if (req.method === 'PUT') {
      const result = await productService.updateProduct(id, req.body);
      res.json(result);
    } else if (req.method === 'DELETE') {
      const result = await productService.deleteProduct(id);
      res.json(result);
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
