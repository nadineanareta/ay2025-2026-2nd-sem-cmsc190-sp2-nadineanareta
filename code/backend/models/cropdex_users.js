//table for image and text
module.exports = (sequelize, DataTypes) => {
    const cropdex_users = sequelize.define(
      "cropdex_users",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        username: DataTypes.STRING,
        password: DataTypes.STRING,
        display_name: DataTypes.STRING,

        association_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "cropdex_associations",
            key: "id",
          },
        },

        access_level_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "cropdex_access_levels",
            key: "id",
          },
        },
        is_approved: DataTypes.TINYINT,
        user_description: {
          type: DataTypes.TEXT,
          allowNull: true,
        }
      },
      {
        timestamps: false, //disable createdAt and updatedAt
      }
    );

    cropdex_users.associate = (models) => {

        cropdex_users.belongsTo(models.cropdex_associations, {
            foreignKey: 'association_id'
        });

        cropdex_users.belongsTo(models.cropdex_access_levels, {
            foreignKey: 'access_level_id'
        });

        cropdex_users.hasMany(models.cropdex_image_data, {
            foreignKey: 'uploader_id'
        });

        cropdex_users.hasMany(models.cropdex_annotations, {
            foreignKey: 'annotator_id'
        });

        cropdex_users.hasMany(models.cropdex_validations, {
            foreignKey: 'validator_id'
        });

        cropdex_users.hasMany(models.cropdex_ai_models, {
          foreignKey: 'developer_id'
        })

    };

    return cropdex_users
}