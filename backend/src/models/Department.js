const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Department extends Model {
    static associate(models) {
      // Hierarki departemen (self-referencing)
      Department.belongsTo(models.Department, {
        foreignKey: "parent_id",
        as: "parent",
      });

      Department.hasMany(models.Department, {
        foreignKey: "parent_id",
        as: "children",
      });

      // Kepala departemen
      Department.belongsTo(models.User, {
        foreignKey: "head_user_id",
        as: "head",
      });

      // Tim dalam departemen
      Department.hasMany(models.Team, {
        foreignKey: "department_id",
        as: "teams",
      });
    }

    // Get full hierarchy path
    async getHierarchyPath() {
      const path = [this.name];
      let current = this;

      while (current.parent_id) {
        current = await Department.findByPk(current.parent_id);
        if (current) {
          path.unshift(current.name);
        } else {
          break;
        }
      }

      return path.join(" > ");
    }
  }

  Department.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Nama departemen tidak boleh kosong" },
          len: {
            args: [2, 100],
            msg: "Nama departemen harus 2-100 karakter",
          },
        },
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
          msg: "Kode departemen sudah digunakan",
        },
        validate: {
          notEmpty: { msg: "Kode departemen tidak boleh kosong" },
          isAlphanumeric: {
            msg: "Kode departemen hanya boleh huruf dan angka",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "departments",
          key: "id",
        },
      },
      head_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Tingkat hierarki (0 = root)",
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Urutan tampilan",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Department",
      tableName: "departments",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["code"],
          unique: true,
        },
        {
          fields: ["parent_id"],
        },
        {
          fields: ["head_user_id"],
        },
      ],
    }
  );

  return Department;
};
