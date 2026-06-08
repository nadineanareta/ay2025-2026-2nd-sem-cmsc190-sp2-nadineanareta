'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('cropdex_validations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      image_data_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cropdex_image_data', // Name of the existing table
          key: 'id',       // Primary key of the existing table
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      validator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cropdex_users', // Name of the existing table
          key: 'id',       // Primary key of the existing table
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('cropdex_validations');
  }
};
