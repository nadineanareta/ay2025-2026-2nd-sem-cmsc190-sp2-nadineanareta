'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("cropdex_users", "is_approved", {
      type: Sequelize.BOOLEAN,
      defaultValue: true, // Auto-approve existing users
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("cropdex_users", "is_approved");
  },
};