const express = require("express");
const cors = require("cors");

const {
    initializeDatabase,
    query
} = require("./db/database");

const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "ecommerce-backend"
    });
});

app.get("/health/db", async (req, res) => {
    try {
        const result = await query("SELECT NOW()");

        res.json({
            status: "healthy",
            database: "connected",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database health check failed:", error);

        res.status(500).json({
            status: "unhealthy",
            database: "disconnected"
        });
    }
});

app.use("/api/products", productRoutes);

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`Backend running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to initialize database:", error);
        process.exit(1);
    }
}

startServer();
