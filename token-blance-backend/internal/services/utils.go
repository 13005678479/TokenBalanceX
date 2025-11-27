package services

import "strconv"

// StringToInt converts string to integer, returns 0 if conversion fails
func StringToInt(s string) int {
	if s == "" {
		return 0
	}
	val, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return val
}
