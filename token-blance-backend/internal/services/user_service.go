package services

import (
	"token-balance/internal/models"

	"gorm.io/gorm"
)

// UserService 用户服务
type UserService struct {
	db *gorm.DB
}

// NewUserService 创建用户服务
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db: db,
	}
}

// GetUserByAddress 根据地址获取用户
func (us *UserService) GetUserByAddress(address string) (*models.User, error) {
	var user models.User
	err := us.db.Where("id = ?", address).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// 如果用户不存在，创建新用户
			user = models.User{
				ID:          address,
				Balance:     "0",
				TotalPoints: 0,
			}
			err = us.db.Create(&user).Error
			if err != nil {
				return nil, err
			}
			return &user, nil
		}
		return nil, err
	}
	return &user, nil
}

// GetUserBalanceHistory 获取用户余额历史
func (us *UserService) GetUserBalanceHistory(address, page, pageSize string) (*models.PaginatedData, error) {
	var histories []models.UserBalanceHistory
	var total int64

	offset := 0
	if page != "1" {
		// 简单计算offset（实际应用中应该使用更好的分页库）
		offset = (StringToInt(page) - 1) * StringToInt(pageSize)
	}

	// 查询总数
	err := us.db.Model(&models.UserBalanceHistory{}).Where("user_address = ?", address).Count(&total).Error
	if err != nil {
		return nil, err
	}

	// 查询数据
	err = us.db.Where("user_address = ?", address).
		Order("timestamp desc").
		Offset(offset).
		Limit(StringToInt(pageSize)).
		Find(&histories).Error
	if err != nil {
		return nil, err
	}

	totalPages := (total + int64(StringToInt(pageSize)) - 1) / int64(StringToInt(pageSize))

	return &models.PaginatedData{
		Items:      histories,
		Total:      total,
		Page:       StringToInt(page),
		PageSize:   StringToInt(pageSize),
		TotalPages: totalPages + 1,
	}, nil
}

// GetUserPoints 获取用户积分记录
func (us *UserService) GetUserPoints(address string) ([]models.PointsRecord, error) {
	var points []models.PointsRecord
	err := us.db.Where("user_address = ?", address).
		Order("calculate_date desc").
		Limit(100). // 限制返回最新100条记录
		Find(&points).Error
	return points, err
}

// UpdateUserBalance 更新用户余额
func (us *UserService) UpdateUserBalance(address, balance string) error {
	return us.db.Model(&models.User{}).Where("id = ?", address).Update("balance", balance).Error
}

// UpdateUserPoints 更新用户积分
func (us *UserService) UpdateUserPoints(address string, points float64) error {
	return us.db.Model(&models.User{}).Where("id = ?", address).Update("total_points", points).Error
}
