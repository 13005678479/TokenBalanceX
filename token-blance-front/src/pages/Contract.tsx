'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useWeb3 } from '@/contexts/Web3Context';
import { ContractInteraction } from '@/types';
import { formatAddress, formatBalance } from '@/utils/web3';
import { formatNumber, copyToClipboard } from '@/utils/format';
import { 
  FileText, 
  Plus, 
  Minus, 
  ArrowRightLeft, 
  Send,
  Check,
  X,
  ExternalLink,
  Clock,
  RefreshCw
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { toast } from 'react-hot-toast';

interface TransactionHistoryProps {
  transactions: Array<{
    hash: string;
    type: string;
    amount: string;
    to?: string;
    status: 'success' | 'pending' | 'failed';
    timestamp: string;
  }>;
  onClear: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onClear }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-6 text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No transactions yet</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div key={tx.hash || index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full border ${getStatusColor(tx.status)}`}>
                  {getStatusIcon(tx.status)}
                </div>
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {tx.type}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                  {tx.to && (
                    <div className="text-xs text-gray-400">
                      To: {formatAddress(tx.to, 6)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {formatNumber(tx.amount, 4)} TBX
                </div>
                {tx.hash && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span>{tx.hash.slice(0, 8)}...</span>
                    <button
                      onClick={() => copyToClipboard(tx.hash)}
                      className="hover:text-blue-600"
                      title="Copy transaction hash"
                    >
                      <FileText size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

const Contract: React.FC = () => {
  const { address, isConnected, sendTokenTransaction, getTokenBalance, provider } = useWeb3();
  const [balance, setBalance] = useState<string>('0');
  const [totalSupply, setTotalSupply] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<Array<any>>([]);

  // 表单状态
  const [mintForm, setMintForm] = useState({ to: '', amount: '' });
  const [burnForm, setBurnForm] = useState({ amount: '' });
  const [transferForm, setTransferForm] = useState({ to: '', amount: '' });

  // 错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 合约地址
  const contractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || 'localhost';

  // 获取余额信息
  const fetchBalance = async () => {
    if (!isConnected || !address) return;

    setLoading(true);
    try {
      const userBalance = await getTokenBalance(contractAddress, address);
      setBalance(userBalance);

      // 获取总供应量（这里需要添加对应的API）
      // const total = await getTotalSupply(contractAddress, provider);
      // setTotalSupply(total);
    } catch (error: any) {
      console.error('Failed to fetch balance:', error);
      toast.error('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  // 表单验证
  const validateForm = (type: string, data: any): boolean => {
    const newErrors: Record<string, string> = {};

    if (type === 'mint' || type === 'transfer') {
      if (!data.to) {
        newErrors.to = 'Recipient address is required';
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(data.to)) {
        newErrors.to = 'Invalid Ethereum address';
      }
    }

    if (!data.amount || parseFloat(data.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (type === 'burn') {
      const balanceNum = parseFloat(balance);
      const burnAmount = parseFloat(data.amount);
      if (burnAmount > balanceNum) {
        newErrors.amount = 'Insufficient balance';
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // 处理交易
  const handleTransaction = async (type: string, data: any) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!validateForm(type, data)) {
      return;
    }

    setLoading(true);
    try {
      const interaction: ContractInteraction = {
        to: data.to || address,
        amount: data.amount,
        type: type as any
      };

      const txHash = await sendTokenTransaction(contractAddress, interaction);
      
      // 添加到历史记录
      const newTransaction = {
        hash: txHash,
        type: type,
        amount: data.amount,
        to: data.to,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      setTransactionHistory(prev => [newTransaction, ...prev.slice(0, 9)]);

      // 清空表单
      if (type === 'mint') setMintForm({ to: '', amount: '' });
      else if (type === 'burn') setBurnForm({ amount: '' });
      else if (type === 'transfer') setTransferForm({ to: '', amount: '' });

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} transaction sent!`);
      
      // 刷新余额
      setTimeout(() => {
        fetchBalance();
      }, 2000);

    } catch (error: any) {
      console.error('Transaction failed:', error);
      toast.error(error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  // 清空交易历史
  const clearHistory = () => {
    setTransactionHistory([]);
    toast.success('Transaction history cleared');
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Connect your wallet to interact with the contract</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Interaction</h1>
          <p className="text-gray-600 mt-2">Mint, burn, and transfer tokens</p>
        </div>
        
        <Button
          variant="outline"
          onClick={fetchBalance}
          loading={loading}
          icon={<RefreshCw size={16} />}
        >
          Refresh
        </Button>
      </div>

      {/* 账户信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Your Account</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Address</div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                  {formatAddress(address || '', 8)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Balance</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(balance, 4)} TBX
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Contract Info</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Contract Address</div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
                  {contractAddress}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Supply</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(totalSupply, 0)} TBX
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 交易表单 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mint */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Mint Tokens</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Recipient Address"
                value={mintForm.to}
                onChange={(e) => setMintForm(prev => ({ ...prev, to: e.target.value }))}
                placeholder="0x..."
                error={errors.to}
              />
              
              <Input
                label="Amount"
                type="number"
                value={mintForm.amount}
                onChange={(e) => setMintForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                error={errors.amount}
              />
              
              <Button
                className="w-full"
                onClick={() => handleTransaction('mint', mintForm)}
                loading={loading}
                icon={<Plus size={16} />}
              >
                Mint
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Burn */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Minus className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Burn Tokens</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Balance
                </label>
                <div className="text-lg font-medium text-blue-600">
                  {formatNumber(balance, 4)} TBX
                </div>
              </div>
              
              <Input
                label="Amount to Burn"
                type="number"
                value={burnForm.amount}
                onChange={(e) => setBurnForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                error={errors.amount}
              />
              
              <Button
                className="w-full"
                variant="danger"
                onClick={() => handleTransaction('burn', burnForm)}
                loading={loading}
                icon={<Minus size={16} />}
              >
                Burn
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Transfer */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Transfer Tokens</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Recipient Address"
                value={transferForm.to}
                onChange={(e) => setTransferForm(prev => ({ ...prev, to: e.target.value }))}
                placeholder="0x..."
                error={errors.to}
              />
              
              <Input
                label="Amount"
                type="number"
                value={transferForm.amount}
                onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                error={errors.amount}
              />
              
              <Button
                className="w-full"
                onClick={() => handleTransaction('transfer', transferForm)}
                loading={loading}
                icon={<Send size={16} />}
              >
                Transfer
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 交易历史 */}
      <TransactionHistory
        transactions={transactionHistory}
        onClear={clearHistory}
      />
    </div>
  );
};

export default Contract;