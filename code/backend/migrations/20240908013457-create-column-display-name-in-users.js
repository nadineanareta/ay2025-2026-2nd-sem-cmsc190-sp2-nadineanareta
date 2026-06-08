'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('cropdex_users', 'display_name', {
      type: Sequelize.STRING,
      allowNull: true // or true, depending on your requirements
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('cropdex_users', 'display_name');
  }
};
