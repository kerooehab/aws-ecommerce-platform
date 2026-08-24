const pool = require("../db/database");

const getProducts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.stock_quantity,
                p.image_url,
                p.category_id,
                c.name AS category_name,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve products"
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.stock_quantity,
                p.image_url,
                p.category_id,
                c.name AS category_name,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve product"
        });
    }
};

const createProduct = async (req, res) => {
    try {
        const {
            category_id,
            name,
            description,
            price,
            stock_quantity,
            image_url
        } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({
                error: "Name and price are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO products
            (category_id, name, description, price, stock_quantity, image_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            category_id || null,
            name,
            description || null,
            price,
            stock_quantity || 0,
            image_url || null
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to create product"
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            category_id,
            name,
            description,
            price,
            stock_quantity,
            image_url
        } = req.body;

        const result = await pool.query(`
            UPDATE products
            SET
                category_id = $1,
                name = $2,
                description = $3,
                price = $4,
                stock_quantity = $5,
                image_url = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `, [
            category_id || null,
            name,
            description || null,
            price,
            stock_quantity || 0,
            image_url || null,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to update product"
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM products WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to delete product"
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
