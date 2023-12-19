const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const app = express();
const users = require("./database/users.json");

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// Middleware to check if user is authenticated
const authenticateUser = (req, res, next) => {
	console.log("authenticatorr middleware running ");
	const authToken = req.cookies.authToken;
	if (!authToken) {
		res.redirect("/login.html");
	} else {
		// res.redirect("/home.html");
		next();
	}
};

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, "../frontend")));

// Login endpoint
app.post("/login", (req, res) => {
	const { email_id, password } = req.body;

	const user = users.find((user) => user.email_id === email_id && user.password === password);

	if (user) {
		// Set cookie when login is successful
		res.cookie("authToken", "authenticated", {
			httpOnly: true, // Ensures cookie can't be accessed by JavaScript
			sameSite: "Lax", // Set SameSite to Lax or None based on your needs
		});

		// Send JSON response for successful login
		// res.status(200).json({ message: "Login successful" });
		return res.status(200).json({ message: "Login successful", redirectTo: "/home.html" });

		// Redirect to home page after successful login
		// console.log("redirecting to home page.....");
		// return res.redirect("/home.html");
	} else {
		res.status(401).json({ error: "Invalid credentials" });
	}
});

// Home Page -2 endpoints
app.use(authenticateUser); // Apply authentication middleware

// Error handling middleware
// app.use((err, req, res, next) => {
// 	console.error(err.stack);
// 	res.status(500).send(`Something went wrong! ${err.message}`); // Include error message for debugging
// });

// Submit data endpoint
app.post("/submitData", (req, res) => {
	const newData = req.body.data;
	let userData = req.cookies.userData || "[]"; // Retrieve existing data or initialize an empty array if none exists

	try {
		// Try parsing the retrieved data from the cookie as an array
		userData = JSON.parse(userData);
	} catch (error) {
		// Handle parsing error (e.g., invalid JSON string in the cookie)
		console.error("Error parsing userData from cookie:", error);
		userData = []; // Reset to an empty array
	}

	userData.push(newData);

	res.cookie("userData", JSON.stringify(userData)); // Store as a JSON string in the cookie
	res.status(200).json({ message: "Data submitted successfully" });
});

// Search data endpoint
// app.get("/searchData", (req, res) => {
// 	const searchData = req.query.search;
// 	const userData = req.cookies.userData || "";

// 	if (userData.includes(searchData)) {
// 		res.status(200).json({ data: userData });
// 	} else {
// 		res.status(404).json({ message: "No matching data found" });
// 	}
// });

// Search data endpoint
app.get("/searchData", (req, res) => {
	const searchData = req.query.search;
	let userData = req.cookies.userData || "[]"; // Retrieve existing data or initialize an empty array if none exists

	try {
		// Try parsing the retrieved data from the cookie as an array
		userData = JSON.parse(userData);

		if (!Array.isArray(userData)) {
			throw new Error("userData is not an array");
		}

		// Perform search logic here with searchData and userData
		const matchingData = userData.filter((item) => item.includes(searchData));

		if (matchingData.length > 0) {
			res.status(200).json({ data: matchingData });
		} else {
			res.status(404).json({ message: "No matching data found" });
		}
	} catch (error) {
		console.error("Error handling userData from cookie:", error);
		res.status(500).json({ message: "Error processing data" });
	}
});

// Clear cookie endpoint
app.get("/clearCookie", (req, res) => {
	res.clearCookie("userData");
	res.status(200).json({ message: "Cookie cleared successfully" });
});

// Logout endpoint
app.get("/logout", (req, res) => {
	res.clearCookie("authToken");
	res.clearCookie("userData"); // Clear userData on logout
	res.redirect("/login.html");
});

// Serve login page
app.get("/login.html", (req, res) => {
	res.sendFile(path.join(__dirname, "../frontend", "login.html"));
});

// Serve home page
app.get("/home.html", (req, res) => {
	res.sendFile(path.join(__dirname, "../frontend", "home.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something went wrong!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
