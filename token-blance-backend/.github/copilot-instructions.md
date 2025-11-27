# TokenBalanceX Backend - AI Coding Guidelines

## Project Overview

**TokenBalanceX** is a blockchain token balance tracking and points calculation system built in Go. It tracks cryptocurrency transactions, maintains user balances, calculates loyalty points, and provides analytics. The architecture uses:
- **Go 1.21** with **Gin** web framework
- **GORM** ORM with **MySQL** database  
- **Swagger** API documentation
- **Cron** for scheduled tasks (hourly points calculation)
- Placeholder implementation for blockchain event listening (Ethereum)

## Architecture & Service Boundaries

### Core Service Layer (`internal/services/`)

**Three main services handle business logic:**

1. **UserService** (`user_service.go`)
   - Query users by address, create on first access
   - Paginated balance history retrieval
   - User points lookups (last 100 records)
   - Direct balance/points updates

2. **EventService** (`event_service.go`)  
   - Listens to blockchain Transfer/Mint/Burn events (placeholder)
   - Records balance changes in history
   - Paginated recent event queries
   - Current implementation uses 30-second polling mock

3. **PointsService** (`points_service.go`)
   - Hourly cron job calculates points: `balance × 0.05 per hour`
   - Maintains leaderboard (top users by points)
   - Records daily statistics
   - Gets/calculates points for address ranges

4. **StatsService** (`stats_service.go`)
   - System overview: total users, supply, transactions
   - 24h active users and transaction counts
   - Daily statistics (days-based aggregation)

### Data Flow

```
BlockchainEvents → EventService → UserBalanceHistory records
                                ↓
                         UserService (updates User balances)
                                ↓
                         Cron: PointsService (calculates hourly)
                                ↓
                         PointsRecord, user.total_points
                                ↓
                         StatsService aggregates for reporting
```

### Controller-Service Mapping (`internal/controllers/`)

- **UserController** → UserService (GET user balance, history, points)
- **EventController** → EventService (GET events, trigger sync)
- **PointsController** → PointsService (leaderboard, manual calculation)
- **StatsController** → StatsService (overview, daily stats)

### Database Models (`internal/models/` vs `pkg/database/models.go`)

**Two model definitions exist:**
- **`internal/models/`** - Simpler entities used by services (User.ID is address string)
- **`pkg/database/models.go`** - Production schema with numeric IDs and Decimal types

⚠️ **Currently services use internal/models; database uses pkg/database models. This creates a schema mismatch to fix.**

## Common Patterns & Conventions

### String-to-Int Conversion
Located in `internal/services/utils.go`:
```go
func StringToInt(s string) int  // Uses strconv.Atoi, handles empty strings
```
Use this for query parameter parsing (`page`, `pageSize`, `limit`, `days`).

### Pagination Standard
All list endpoints return `models.PaginatedData`:
```go
&models.PaginatedData{
    Items:      results,
    Total:      totalCount,
    Page:       pageNum,
    PageSize:   pageSize,
    TotalPages: (total + pageSize - 1) / pageSize,
}
```

### Error Responses
Consistent format across controllers:
```go
c.JSON(statusCode, gin.H{
    "success": true/false,
    "message": "description",  // for errors
    "data":    resultObj,       // for success
})
```

### Logging
Middleware functions in `internal/middleware/logger.go`:
```go
middleware.Info("message with %s", arg)
middleware.Error("error with %v", err)
middleware.Debug("debug info")
```

## Critical Implementation Details

### Points Calculation
- **Formula**: `points = balance × 0.05` per hour
- **Trigger**: Hourly cron job (0 * * * * schedule)
- **Record**: Creates PointsRecord and increments user.total_points
- **Location**: `PointsService.CalculateHourlyPoints()` (line ~47)

### Event Processing
- **Status**: Placeholder implementation - uses mock ticker every 30 seconds
- **Expected**: Should listen to blockchain Transfer events and update balances
- **Location**: `EventService.StartEventListener()` and `handleTransferEvent()` 
- **Note**: `handleTransferEvent()` currently accepts `*models.EventLog` (not parsed contract events)

### User Creation
Auto-create on first query if not found:
```go
if err == gorm.ErrRecordNotFound {
    // Create with address as ID, zero balance/points
}
```

## Key File Locations & Patterns

| Task | Files |
|------|-------|
| Add API endpoint | `internal/controllers/{entity}_controller.go` + `internal/router/router.go` |
| Add business logic | `internal/services/{entity}_service.go` |
| Add data model | `internal/models/{entity}.go` (or extend existing) |
| Add database field | `pkg/database/models.go` (requires migration) |
| Configuration | `config/config.go` (app settings), `.env` (runtime values) |
| Database setup | `pkg/database/connection.go` and `database.go` |
| Entry point | `cmd/api/main.go` (service initialization, middleware setup) |

## Build & Development

### Commands
```bash
go run cmd/api/main.go              # Run with hot reload (development)
go build -o token-balance cmd/api/main.go  # Production build
go mod download                     # Install dependencies
```

### Database
- Uses GORM AutoMigrate (auto schema creation)
- Models defined in `pkg/database/models.go`
- Connection via `pkg/database/InitDB()`

### Docker
Dockerfile uses multi-stage build; `docker-compose.yml` included.

## Schema Reconciliation Task

**Immediate issue**: Service layer uses `internal/models` (simpler) but database expects `pkg/database/models` (strict types). Fix by:
1. Standardize all services to use `pkg/database/models` 
2. Update types: `string Balance` → `decimal.Decimal`, `string` addresses handled consistently
3. Ensure GORM relationships match (UserID vs direct address lookups)

## Testing & Validation Notes

- Swagger docs at `http://localhost:8080/swagger/index.html` after startup
- No unit tests present - candidate for adding
- Middleware has logging; errors logged via `middleware.Error()`
- Config loaded from `.env` (see `config.LoadConfig()`)
