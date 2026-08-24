const express = require("express");
const cors = require("cors");

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

app.listen(PORT, () => {
	    console.log(`Backend running on port ${PORT}`);
}):
