'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('cropdex_annotations', 'label_type', {
      type: Sequelize.STRING,
      allowNull: false, // Adjust depending on your requirements
      defaultValue: 'unknown' // Set your default value here
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('cropdex_annotations', 'label_type');
  }
};
