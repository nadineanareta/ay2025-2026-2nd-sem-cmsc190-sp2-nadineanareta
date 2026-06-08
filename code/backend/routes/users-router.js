const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { cropdex_users } = require("../models");
const { cropdex_access_levels, cropdex_associations } = require("../models");
const authenticateToken = require("../authentication/authentication_middleware");
const bcrypt = require("bcrypt");

const secretKey = "cdex_secret_2024_sample";

router.post("/loginauth", async (req, res) => {
  try {
    const data = await cropdex_users.findOne({
      attributes: ["id", "username", "password", "is_approved"],
      where: {
        username: req.body.username,
        access_level_id: req.body.role,
      },
    });

    if (data) {
      let isMatch = false;
      if (data.password && data.password.startsWith('$2')) {
          isMatch = await bcrypt.compare(req.body.password, data.password);
      } else {
          isMatch = (req.body.password === data.password);
      }

      if (isMatch) {
        const token = jwt.sign({ userId: data.id }, secretKey, {
          expiresIn: "3d",
        });
        res.json({ userid: data.id, is_approved: data.is_approved, error_code: 0, token: token });
      } else {
        res.json({
          userid: -1,
          error_code: 770,
          error_message: "Incorrect Login Credentials",
        });
      }
    } else {
      res.json({
        userid: -1,
        error_code: 770,
        error_message: "Incorrect Login Credentials",
      });
    }
  } catch (error) {
    console.error("Error fetching cropdex data: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/get-user-details", authenticateToken, async (req, res) => {
  try {
    const data = await cropdex_users.findOne({
      attributes: ["id", "username", "display_name", "access_level_id"],
      where: { id: req.user.userId },
    });

    if (data != undefined) {
      res.json({
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        access_level_id: data.access_level_id,
        error_code: 0,
      });
    } else {
      res.json({ error_code: 771, error_message: "Missing User Data" });
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const data = await cropdex_users.findOne({
      attributes: ["id", "username"],
      where: { username: req.body.username },
    });
    if (data != undefined) {
      res.json({
        userid: -1,
        error_code: 772,
        error_message: "Email already taken",
      });
    } else {

      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      await cropdex_users.create({
        username: req.body.username,
        password: hashedPassword,
        display_name: req.body.display_name,
        association_id: parseInt(req.body.association),
        access_level_id: parseInt(req.body.access_level_id),
        is_approved: 0, // Default to not approved
      });

      res.json({ error_code: 0, message: "User registered successfully"});
    }
  } catch (error) {
    console.error("Error fetching cropdex data: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/get-pending-users", authenticateToken, async (req, res) => {
  console.log("Request received to get pending users");
  try {
    if (req.authUserData.access_level_id != 6) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userdata = await cropdex_users.findAll({
      attributes: [
        "id",
        "username",
        "display_name",
        "access_level_id",
        "association_id",
      ],
      where: { is_approved: 0 },
    });

    const access_level_data = await cropdex_access_levels.findAll({
      attributes: ["id", "access_level"],
    });
    const association_data = await cropdex_associations.findAll({
      attributes: ["id", "association"],
    });
    const data = userdata.map((user) => {
      const access_level = access_level_data.find(
        (level) => level.id === user.access_level_id
      );
      const association = association_data.find(
        (assoc) => assoc.id === user.association_id
      );
      return {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        access_level: access_level ? access_level.access_level : "Error",
        association: association ? association.association : "Error",
      };
    });
    res.json({ pending_users: data, error_code: 0 });
  } catch (error) {
    console.error("Error fetching pending users: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/approve-user", authenticateToken, async (req, res) => {
  try {
    if (req.authUserData.access_level_id != 6) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userId = req.body.userId;
    await cropdex_users.update({ is_approved: 1 }, { where: { id: userId } });

    res.json({ message: "User approved successfully", error_code: 0 });
  } catch (error) {
    console.error("Error approving user: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/disapprove-user", authenticateToken, async (req, res) => {
  try {
    if (req.authUserData.access_level_id != 6) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userId = req.body.userId;
    await cropdex_users.update({ is_approved: -1 }, { where: { id: userId } });

    res.json({ message: "User approved successfully", error_code: 0 });
  } catch (error) {
    console.error("Error approving user: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /get-account-data route to fetch user data for the account page
router.get("/get-account-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; 
    const userData = await cropdex_users.findOne({
      attributes: [
        "id",
        "username",
        "display_name",
        "access_level_id",
        "association_id",
        "user_description"
      ],
      where: { id: userId },
    });

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    const accessLevel = await cropdex_access_levels.findOne({
      attributes: ["access_level"],
      where: { id: userData.access_level_id },
    });

    const association = await cropdex_associations.findOne({
      attributes: ["association"],
      where: { id: userData.association_id },
    });

    res.json({
      id: userData.id,
      username: userData.username,
      display_name: userData.display_name,
      access_level_id: userData.access_level_id,
      association_id: userData.association_id,   
      access_level: accessLevel ? accessLevel.access_level : null,
      association: association ? association.association : null,
      user_description: userData.user_description || "",
    });
  } catch (error) {
    console.error("Error fetching account data: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /update-profile route to handle profile updates from the frontend
router.post("/update-profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; 
    const { display_name, association_id, user_description } = req.body;

    if (!display_name || !association_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [updatedRows] = await cropdex_users.update(
      { 
        display_name: display_name, 
        association_id: parseInt(association_id),
        user_description: user_description || "" 
      },
      { where: { id: userId } }
    );

    res.json({ message: "Profile updated successfully", error_code: 0 });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
