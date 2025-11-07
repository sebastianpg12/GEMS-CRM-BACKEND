const User = require('../models/User');
const fs = require('fs');
const path = require('path');

/**
 * Servicio para gestión de avatares y fotos de perfil de usuario
 */
class AvatarService {
  /**
   * Obtiene el avatar actual del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Información de avatar del usuario
   */
  static async getUserAvatar(userId) {
    try {
      const user = await User.findById(userId).select('avatar photo');
      
      // Si no existe el usuario, devolver null
      if (!user) return null;
      
      // Devolver tanto el avatar predefinido como la foto personalizada
      return {
        avatar: user.avatar,
        photo: user.photo
      };
    } catch (error) {
      console.error('Error getting user avatar:', error);
      throw new Error('Error obteniendo avatar del usuario');
    }
  }

  /**
   * Actualiza el avatar del usuario
   * @param {string} userId - ID del usuario
   * @param {string|null} avatarId - ID del avatar o null para quitar avatar
   * @returns {Promise<Object>} Usuario actualizado
   */
  static async updateUserAvatar(userId, avatarId) {
    try {
      // Validar que el avatarId sea válido si se proporciona
      if (avatarId && typeof avatarId !== 'string') {
        throw new Error('ID de avatar inválido');
      }

      // Si se establece un avatar predefinido, quitar la foto personalizada
      const updateData = { 
        avatar: avatarId,
        photo: null // Remover foto cuando se selecciona avatar
      };

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        throw new Error('Usuario no encontrado');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza la foto de perfil personalizada del usuario
   * @param {string} userId - ID del usuario
   * @param {string} photoPath - Ruta del archivo de foto
   * @returns {Promise<Object>} Usuario actualizado
   */
  static async updateUserPhoto(userId, photoPath) {
    try {
      // Obtener datos actuales del usuario para eliminar foto antigua si existe
      const currentUser = await User.findById(userId).select('photo');
      
      if (!currentUser) {
        throw new Error('Usuario no encontrado');
      }
      
      // Si el usuario ya tenía una foto, intentar eliminarla
      if (currentUser.photo) {
        try {
          const oldPhotoPath = path.join(__dirname, '..', currentUser.photo);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        } catch (err) {
          console.warn('No se pudo eliminar la foto antigua:', err);
          // No lanzamos error para continuar con la actualización
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          photo: photoPath,
          avatar: null // Si se sube foto, quitar el avatar predefinido
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        throw new Error('Usuario no encontrado');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user photo:', error);
      throw error;
    }
  }

  /**
   * Obtiene avatares disponibles (lista de IDs válidos)
   * @returns {Array<string>} Lista de avatares disponibles
   */
  static getAvailableAvatars() {
    return [
      'ruby',
      'sapphire',
      'emerald',
      'diamond',
      'amethyst',
      'topaz',
      'opal',
      'pearl'
    ];
  }

  /**
   * Valida si un avatar ID es válido
   * @param {string} avatarId - ID del avatar a validar
   * @returns {boolean} True si es válido
   */
  static isValidAvatar(avatarId) {
    if (!avatarId || typeof avatarId !== 'string') return false;
    return this.getAvailableAvatars().includes(avatarId);
  }

  /**
   * Obtiene el avatar por defecto del sistema
   * @returns {string} Avatar por defecto
   */
  static getDefaultAvatar() {
    return 'ruby';
  }

  /**
   * Obtiene estadísticas de uso de avatares
   * @returns {Promise<Object>} Estadísticas de avatares
   */
  static async getAvatarStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$avatar',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return stats.reduce((acc, stat) => {
        acc[stat._id || 'none'] = stat.count;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting avatar stats:', error);
      throw new Error('Error obteniendo estadísticas de avatares');
    }
  }
}

module.exports = AvatarService;