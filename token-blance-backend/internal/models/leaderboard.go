package models

// LeaderboardEntry 积分排行榜条目
type LeaderboardEntry struct {
	Rank        int     `json:"rank"`
	Address     string  `json:"address"`
	Balance     string  `json:"balance"`
	TotalPoints float64 `json:"total_points"`
}

// DailyStats 每日统计数据
type DailyStats struct {
	Date             string  `json:"date"`
	NewUsers         uint    `json:"new_users"`
	Transactions     uint    `json:"transactions"`
	Volume           string  `json:"volume"`
	PointsCalculated float64 `json:"points_calculated"`
}
