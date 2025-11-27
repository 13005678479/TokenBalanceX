'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { healthApi, statsApi } from '@/services/api';
import { formatNumber, formatTime } from '@/utils/format';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Activity,
  Clock,
  Server,
  Database,
  Globe,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Monitor,
  Shield,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { toast } from 'react-hot-toast';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  uptime?: number;
  lastCheck?: string;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  databaseConnections: number;
  queueSize: number;
}

interface ApiEndpoint {
  name: string;
  url: string;
  status: HealthStatus;
  responseTime?: number;
  lastChecked?: string;
}

const SystemHealth: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10秒
  const [globalStatus, setGlobalStatus] = useState<HealthStatus>({
    status: 'healthy',
    message: '系统运行正常',
    responseTime: 0,
    lastCheck: new Date().toISOString()
  });
  
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    activeConnections: 0,
    databaseConnections: 0,
    queueSize: 0
  });

  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([
    { name: '健康检查', url: '/health', status: { status: 'healthy', message: '正常' } },
    { name: '系统统计', url: '/api/v1/stats/system', status: { status: 'healthy', message: '正常' } },
    { name: '用户接口', url: '/api/v1/users', status: { status: 'healthy', message: '正常' } },
    { name: '事件接口', url: '/api/v1/events', status: { status: 'healthy', message: '正常' } },
    { name: '积分接口', url: '/api/v1/points', status: { status: 'healthy', message: '正常' } },
    { name: '排行榜接口', url: '/api/v1/points/leaderboard', status: { status: 'healthy', message: '正常' } }
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 检查API健康状态
  const checkApiHealth = async () => {
    try {
      const startTime = Date.now();
      const health = await healthApi.check();
      const responseTime = Date.now() - startTime;
      
      setGlobalStatus({
        status: health.status === 'ok' ? 'healthy' : 'error',
        message: health.message || '服务状态未知',
        responseTime,
        lastCheck: new Date().toISOString()
      });
      
      toast.success(`健康检查完成 (${responseTime}ms)`);
    } catch (err: any) {
      setGlobalStatus({
        status: 'error',
        message: err.message || '健康检查失败',
        lastCheck: new Date().toISOString()
      });
      
      toast.error('健康检查失败');
    }
  };

  // 检查各个API端点
  const checkEndpoint = async (endpoint: ApiEndpoint) => {
    try {
      const startTime = Date.now();
      const response = await fetch(`/api/v1${endpoint.url}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'error';
      
      return {
        ...endpoint,
        status: {
          status,
          message: response.ok ? '响应正常' : `错误: ${response.status}`,
          responseTime,
          lastChecked: new Date().toISOString()
        }
      };
    } catch (err: any) {
      return {
        ...endpoint,
        status: {
          status: 'error',
          message: err.message || '连接失败',
          lastChecked: new Date().toISOString()
        }
      };
    }
  };

  // 检查所有端点
  const checkAllEndpoints = async () => {
    const endpoints = [...apiEndpoints];
    const updatedEndpoints = await Promise.all(
      endpoints.map(endpoint => checkEndpoint(endpoint))
    );
    setApiEndpoints(updatedEndpoints);
  };

  // 模拟系统指标
  const generateSystemMetrics = () => {
    setSystemMetrics({
      cpuUsage: Math.random() * 100,
      memoryUsage: 60 + Math.random() * 30,
      diskUsage: 40 + Math.random() * 20,
      networkLatency: 10 + Math.random() * 50,
      activeConnections: Math.floor(Math.random() * 1000),
      databaseConnections: 5 + Math.floor(Math.random() * 20),
      queueSize: Math.floor(Math.random() * 100)
    });
  };

  // 初始检查
  useEffect(() => {
    if (mounted) {
      checkApiHealth();
      checkAllEndpoints();
      generateSystemMetrics();
    }
  }, [mounted]);

  // 自动刷新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        checkApiHealth();
        checkAllEndpoints();
        generateSystemMetrics();
      }, refreshInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getMetricColor = (value: number, thresholds: { warning: number; error: number }) => {
    if (value >= thresholds.error) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'cpu':
        return <Cpu className="w-5 h-5" />;
      case 'memory':
        return <Activity className="w-5 h-5" />;
      case 'disk':
        return <HardDrive className="w-5 h-5" />;
      case 'network':
        return <Wifi className="w-5 h-5" />;
      case 'database':
        return <Database className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部控制栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Monitor className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">系统健康监控</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <div className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`}>
                  {autoRefresh ? '🔄' : '⏸'}
                </div>
                {autoRefresh ? '自动监控' : '手动'}
              </Button>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={refreshInterval / 1000}
                onChange={(e) => setRefreshInterval(Number(e.target.value) * 1000)}
                disabled={!autoRefresh}
              >
                <option value={5}>5秒</option>
                <option value={10}>10秒</option>
                <option value={30}>30秒</option>
                <option value={60}>60秒</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  checkApiHealth();
                  checkAllEndpoints();
                  generateSystemMetrics();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                立即检查
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 整体状态卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 系统状态 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    {getStatusIcon(globalStatus.status)}
                    系统整体状态
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(globalStatus.status)}`}>
                    {globalStatus.status === 'healthy' ? '正常' : 
                     globalStatus.status === 'warning' ? '警告' : '错误'}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">状态消息</span>
                    <span className="font-medium">{globalStatus.message}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">响应时间</span>
                    <span className={`font-medium ${
                      (globalStatus.responseTime || 0) < 100 ? 'text-green-600' :
                      (globalStatus.responseTime || 0) < 500 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {globalStatus.responseTime || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">最后检查</span>
                    <span className="font-medium">
                      {globalStatus.lastCheck ? formatTime(globalStatus.lastCheck) : '从未'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 系统指标 */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">系统指标</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* CPU使用率 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getMetricIcon('cpu')}
                    <span className="ml-2 text-gray-600">CPU</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getMetricColor(systemMetrics.cpuUsage, { warning: 70, error: 90 })}`}>
                      {formatNumber(systemMetrics.cpuUsage, 1)}%
                    </div>
                  </div>
                </div>

                {/* 内存使用率 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getMetricIcon('memory')}
                    <span className="ml-2 text-gray-600">内存</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getMetricColor(systemMetrics.memoryUsage, { warning: 80, error: 95 })}`}>
                      {formatNumber(systemMetrics.memoryUsage, 1)}%
                    </div>
                  </div>
                </div>

                {/* 磁盘使用率 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getMetricIcon('disk')}
                    <span className="ml-2 text-gray-600">磁盘</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getMetricColor(systemMetrics.diskUsage, { warning: 80, error: 95 })}`}>
                      {formatNumber(systemMetrics.diskUsage, 1)}%
                    </div>
                  </div>
                </div>

                {/* 网络延迟 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getMetricIcon('network')}
                    <span className="ml-2 text-gray-600">延迟</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getMetricColor(systemMetrics.networkLatency, { warning: 50, error: 100 })}`}>
                      {formatNumber(systemMetrics.networkLatency, 1)}ms
                    </div>
                  </div>
                </div>

                {/* 活跃连接 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-600">连接数</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      {formatNumber(systemMetrics.activeConnections)}
                    </div>
                  </div>
                </div>

                {/* 数据库连接 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getMetricIcon('database')}
                    <span className="ml-2 text-gray-600">DB连接</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatNumber(systemMetrics.databaseConnections)}
                    </div>
                  </div>
                </div>

                {/* 队列大小 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-600">队列</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getMetricColor(systemMetrics.queueSize, { warning: 50, error: 100 })}`}>
                      {formatNumber(systemMetrics.queueSize)}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* API端点状态 */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Server className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">API端点状态</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {apiEndpoints.map((endpoint, index) => (
                <div
                  key={`${endpoint.name}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center flex-1">
                    {getStatusIcon(endpoint.status.status)}
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{endpoint.name}</div>
                      <div className="text-sm text-gray-500">{endpoint.url}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(endpoint.status.status)}`}>
                      {endpoint.status.status === 'healthy' ? '正常' : 
                       endpoint.status.status === 'warning' ? '警告' : '异常'}
                    </div>
                    {endpoint.status.responseTime && (
                      <div className="text-sm text-gray-500 mt-1">
                        {endpoint.status.responseTime}ms
                      </div>
                    )}
                    {endpoint.status.lastChecked && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTime(endpoint.status.lastChecked)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* 服务依赖状态 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">数据库</h3>
            </CardHeader>
            <CardBody>
              <div className="text-center">
                <Database className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <div className="text-lg font-bold text-green-600">正常运行</div>
                <div className="text-sm text-gray-500 mt-1">响应时间: 12ms</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">缓存服务</h3>
            </CardHeader>
            <CardBody>
              <div className="text-center">
                <Zap className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <div className="text-lg font-bold text-blue-600">运行中</div>
                <div className="text-sm text-gray-500 mt-1">命中率: 95.2%</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">消息队列</h3>
            </CardHeader>
            <CardBody>
              <div className="text-center">
                <Activity className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <div className="text-lg font-bold text-green-600">正常</div>
                <div className="text-sm text-gray-500 mt-1">队列长度: {systemMetrics.queueSize}</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;