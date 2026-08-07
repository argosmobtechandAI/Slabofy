import { pool } from '../config/db.js';

/**
 * BE-08: Product Listing (Seller only)
 */
export const createProduct = async (req, res) => {
  const { name, description, images, category_id, sku, stock, tiers } = req.body;
  const sellerId = req.user.id;

  // 1. Verify seller is approved
  try {
    const sellerCheck = await pool.query(
      'SELECT is_approved FROM seller_profiles WHERE user_id = $1',
      [sellerId]
    );
    const seller = sellerCheck.rows[0];
    if (!seller || !seller.is_approved) {
      return res.status(403).json({ error: 'Only approved sellers can list products' });
    }
  } catch (error) {
    console.error('Error verifying seller status:', error.message);
    return res.status(500).json({ error: 'Server error verifying seller status' });
  }

  // 2. Validate input fields
  if (!name || stock === undefined || !tiers || !Array.isArray(tiers)) {
    return res.status(400).json({ error: 'Name, stock, and tiers list are required' });
  }

  // Validate: must include all 5 tiers (1, 2, 3, 5, 10)
  const requiredSizes = [1, 2, 3, 5, 10];
  const providedSizes = tiers.map((t) => parseInt(t.group_size)).sort((a, b) => a - b);
  
  const hasAllTiers = requiredSizes.every((size) => providedSizes.includes(size)) && tiers.length === 5;
  if (!hasAllTiers) {
    return res.status(400).json({ error: 'Tiers must exactly cover group sizes 1, 2, 3, 5, and 10' });
  }

  // Sort tiers by group size descending to validate descending price (e.g. 10 size is cheapest, 1 size is most expensive)
  // Or sort ascending: size 1 > size 2 > size 3 > size 5 > size 10 -> price 1 > price 2 > price 3 > price 5 > price 10
  const sortedTiers = [...tiers].sort((a, b) => a.group_size - b.group_size);
  for (let i = 1; i < sortedTiers.length; i++) {
    const prevPrice = parseFloat(sortedTiers[i - 1].price);
    const currPrice = parseFloat(sortedTiers[i].price);
    if (currPrice >= prevPrice) {
      return res.status(400).json({
        error: `Price validation failed: Pricing must decrease as group size increases. Tier of size ${sortedTiers[i].group_size} (Price: ${currPrice}) is not cheaper than size ${sortedTiers[i - 1].group_size} (Price: ${prevPrice})`
      });
    }
  }

  // 3. Insert Product and Tiers in a DB Transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create product
    const productQuery = `
      INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `;
    const productVal = [
      sellerId,
      category_id || null,
      name,
      description || '',
      JSON.stringify(images || []),
      sku || null,
      stock
    ];
    const productResult = await client.query(productQuery, productVal);
    const newProduct = productResult.rows[0];

    // Insert pricing tiers
    const tierInsertQuery = `
      INSERT INTO product_tiers (product_id, group_size, price)
      VALUES ($1, $2, $3)
    `;
    for (const tier of sortedTiers) {
      await client.query(tierInsertQuery, [newProduct.id, tier.group_size, tier.price]);
    }

    await client.query('COMMIT');

    // Attach tiers to response object
    newProduct.tiers = sortedTiers;
    return res.status(201).json({
      message: 'Product created successfully and is pending approval',
      product: newProduct
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createProduct:', error.message);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Product SKU already exists' });
    }
    return res.status(500).json({ error: 'Server error listing product' });
  } finally {
    client.release();
  }
};

/**
 * BE-11: Edit Product Inventory (Seller only)
 * Sellers cannot edit pricing tiers once a product is created (locked)
 */
export const editProduct = async (req, res) => {
  const { id } = req.params;
  const { description, images, stock } = req.body;
  const sellerId = req.user.id;

  try {
    // 1. Verify product ownership
    const productCheck = await pool.query(
      'SELECT id, seller_id FROM products WHERE id = $1',
      [id]
    );
    const product = productCheck.rows[0];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Access Denied: Product ownership mismatch' });
    }

    // 2. Perform updates
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      queryParams.push(description);
      paramIndex++;
    }

    if (images !== undefined) {
      updateFields.push(`images = $${paramIndex}`);
      queryParams.push(JSON.stringify(images));
      paramIndex++;
    }

    if (stock !== undefined) {
      updateFields.push(`stock = $${paramIndex}`);
      queryParams.push(stock);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    queryParams.push(id);
    const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const updated = await pool.query(query, queryParams);

    return res.status(200).json({
      message: 'Product updated successfully',
      product: updated.rows[0]
    });
  } catch (error) {
    console.error('Error in editProduct:', error.message);
    return res.status(500).json({ error: 'Server error editing product' });
  }
};

/**
 * BE-10: Public Get Products (Paginated & Filterable)
 */
export const getProducts = async (req, res) => {
  const { category_id, search, sort_by, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let queryParams = [];
    let paramIndex = 1;
    let whereClauses = ["status = 'active'"];

    if (category_id) {
      whereClauses.push(`category_id = $${paramIndex}`);
      queryParams.push(category_id);
      paramIndex++;
    }

    if (search) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    let orderByClause = 'ORDER BY created_at DESC';
    if (sort_by === 'price_asc') {
      orderByClause = 'ORDER BY best_price ASC';
    } else if (sort_by === 'price_desc') {
      orderByClause = 'ORDER BY best_price DESC';
    }

    const whereQuery = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Query fetching products along with their pricing tiers aggregated, plus the group-10 price (best price)
    const query = `
      SELECT p.*, c.name as category_name,
             (SELECT price FROM product_tiers WHERE product_id = p.id AND group_size = 1) as solo_price,
             (SELECT price FROM product_tiers WHERE product_id = p.id AND group_size = 10) as best_price,
             (
               SELECT json_agg(json_build_object('group_size', pt.group_size, 'price', pt.price))
               FROM product_tiers pt WHERE pt.product_id = p.id
             ) as tiers,
             (
               SELECT COUNT(*)::int 
               FROM groups g 
               WHERE g.product_id = p.id AND g.status = 'active'
             ) as active_groups_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereQuery}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const productsResult = await pool.query(query, queryParams);

    // Total count for pagination
    const countQuery = `SELECT COUNT(*) FROM products p ${whereQuery}`;
    const totalCountResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
    const totalProducts = parseInt(totalCountResult.rows[0].count);

    return res.status(200).json({
      products: productsResult.rows,
      pagination: {
        totalItems: totalProducts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getProducts:', error.message);
    return res.status(500).json({ error: 'Server error fetching products' });
  }
};

/**
 * BE-10: Public Get Product Detail (by ID)
 */
export const getProductDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const productQuery = `
      SELECT p.*, c.name as category_name,
             (
               SELECT json_agg(json_build_object('group_size', pt.group_size, 'price', pt.price) ORDER BY pt.group_size ASC)
               FROM product_tiers pt WHERE pt.product_id = p.id
             ) as tiers,
             (
               SELECT COUNT(*)::int 
               FROM groups g 
               WHERE g.product_id = p.id AND g.status = 'active'
             ) as active_groups_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.status = 'active'
    `;
    const result = await pool.query(productQuery, [id]);
    const product = result.rows[0];

    if (!product) {
      return res.status(404).json({ error: 'Product not found or inactive' });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error('Error in getProductDetail:', error.message);
    return res.status(500).json({ error: 'Server error fetching product detail' });
  }
};
