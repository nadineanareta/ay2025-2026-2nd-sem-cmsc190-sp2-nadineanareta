// Utility script to fix old image entries with coordinates but "Unknown Location" by 
// translating coordinates to real location names using the geocoder utility function.
const db = require('./models');
const { getProvinceFromCoords } = require('./utils/geocoder.js');
const { Op } = require('sequelize');
const delay = ms => new Promise(res => setTimeout(res, ms));

async function runCleanup() {
  try {
    console.log("Connecting to the database...");
    const oldImages = await db.cropdex_image_data.findAll({
      where: {
        coordinates: {
          [Op.not]: null,
          [Op.not]: ''
        },
        location_name: {
          [Op.eq]: 'Unknown Location'
        }
      }
    });

    console.log(`Found ${oldImages.length} images that need their coordinates translated.`);

    for (let i = 0; i < oldImages.length; i++) {
      const img = oldImages[i];
      console.log(`[${i + 1}/${oldImages.length}] Translating coordinates: ${img.coordinates}...`);

      const realName = await getProvinceFromCoords(img.coordinates);
      img.location_name = realName;
      await img.save();

      console.log(`✅ Saved as: ${realName}`);
      if (i < oldImages.length - 1) {
        await delay(1500); 
      }
    }

    console.log(" All old coordinates have been successfully converted to real names");
    process.exit(0);
  } catch (error) {
    console.error("An error occurred during cleanup:", error);
    process.exit(1);
  }
}
runCleanup();