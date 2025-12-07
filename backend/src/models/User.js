const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     */
    static associate(models) {
      // User creates projects
      User.hasMany(models.Project, {
        foreignKey: 'created_by',
        as: 'createdProjects'
      });

      // User is member of many projects
      User.belongsToMany(models.Project, {
        through: models.ProjectMember,
        foreignKey: 'user_id',
        as: 'projects'
      });

      // User assigned to tasks
      User.hasMany(models.Task, {
        foreignKey: 'assigned_to',
        as: 'assignedTasks'
      });

      // User creates tasks
      User.hasMany(models.Task, {
        foreignKey: 'created_by',
        as: 'createdTasks'
      });

      // User comments
      User.hasMany(models.Comment, {
        foreignKey: 'user_id',
        as: 'comments'
      });

      // User uploads attachments
      User.hasMany(models.Attachment, {
        foreignKey: 'uploaded_by',
        as: 'attachments'
      });

      // User activities
      User.hasMany(models.ActivityLog, {
        foreignKey: 'user_id',
        as: 'activities'
      });

      // User time logs
      User.hasMany(models.TimeLog, {
        foreignKey: 'user_id',
        as: 'timeLogs'
      });

      // User notifications
      User.hasMany(models.Notification, {
        foreignKey: 'user_id',
        as: 'notifications'
      });
    }

    /**
     * Method to compare password
     */
    async comparePassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    /**
     * Convert to JSON (exclude password)
     */
    toJSON() {
      const values = Object.assign({}, this.get());
      delete values.password;
      return values;
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'project_manager', 'developer', 'viewer'),
      defaultValue: 'developer'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};
