const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectMember extends Model {
    static associate(models) {
      // ProjectMember belongs to project
      ProjectMember.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });

      // ProjectMember belongs to user
      ProjectMember.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  ProjectMember.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('owner', 'manager', 'developer', 'viewer'),
      defaultValue: 'developer'
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ProjectMember',
    tableName: 'project_members',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'user_id']
      }
    ]
  });

  return ProjectMember;
};
