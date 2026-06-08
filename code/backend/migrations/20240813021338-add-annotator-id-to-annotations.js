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


    await queryInterface.addColumn('cropdex_annotations', 'annotator_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // allowNull temporarily to avoid immediate constraint issues
    });

    // Step 2: Update the new column with the default values based on the relationship
    await queryInterface.sequelize.query(`
      UPDATE cropdex_annotations
      SET annotator_id = (
        SELECT uploader_id FROM cropdex_image_data WHERE cropdex_image_data.id = cropdex_annotations.image_data_id
      )
    `);

    // Step 3: Modify the column to not allow null values
    await queryInterface.changeColumn('cropdex_annotations', 'annotator_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Step 4: Add the foreign key constraint
    await queryInterface.addConstraint('cropdex_annotations', {
      fields: ['annotator_id'],
      type: 'foreign key',
      name: 'fk_cropdex_annotations_annotator_id',
      references: {
        table: 'cropdex_users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });


    // await queryInterface.addColumn('cropdex_annotations', 'annotator_id', {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    //   references: {
    //     model: 'cropdex_users', // Name of the table you're referencing
    //     key: 'id',      // Primary key in the Users table
    //   },
    //   onUpdate: 'CASCADE',
    //   onDelete: 'RESTRICT', // or 'CASCADE', 'RESTRICT', etc. based on your use case
    // });



  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeConstraint('cropdex_annotations', 'fk_cropdex_annotations_annotator_id');
    await queryInterface.removeColumn('cropdex_annotations', 'annotator_id');

    // await queryInterface.removeColumn('cropdex_annotations', 'annotator_id');
  }
};
