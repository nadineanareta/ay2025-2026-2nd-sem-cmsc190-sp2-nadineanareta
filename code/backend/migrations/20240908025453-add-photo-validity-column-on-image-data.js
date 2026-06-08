'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('cropdex_image_data', 'photo_validity', {
      type: Sequelize.INTEGER,
      allowNull: false, // Adjust depending on your requirements
      defaultValue: -1 // Set your default value here
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('cropdex_image_data', 'photo_validity');
  }
};
