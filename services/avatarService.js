const User = require('../models/User');

/**
 * Servicio para gestión de avatares de usuario
 */
class AvatarService {
  /**
   * Obtiene el avatar actual del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<string|null>} Avatar del usuario o null si no tiene
   */
  static async getUserAvatar(userId) {
    try {
      const user = await User.findById(userId).select('avatar');
      return user ? user.avatar : null;
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

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarId }, // Permite null/undefined
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