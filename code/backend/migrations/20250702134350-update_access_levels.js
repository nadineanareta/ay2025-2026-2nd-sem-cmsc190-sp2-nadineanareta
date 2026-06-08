"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      "cropdex_access_levels",
      { access_level: "Contributor" },
      { id: 4 }
    );

    await queryInterface.bulkUpdate(
      "cropdex_access_levels",
      { access_level: "Moderator" },
      { id: 5 }
    );

    await queryInterface.bulkInsert("cropdex_access_levels", [{
      access_level: "AI Developer"}
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      "cropdex_access_levels",
      { access_level: "Data Collector" },
      { id: 4 }
    );
    await queryInterface.bulkUpdate(
      "cropdex_access_levels",
      { access_level: "Admin" }, 
      { id: 5 }
    );

    await queryInterface.bulkDelete("cropdex_access_levels", {
      access_level: "AI Developer"});
  },
};
