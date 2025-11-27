'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useWeb3 } from '@/contexts/Web3Context';
import { 
  HelpCircle, 
  Book, 
  MessageCircle, 
  ExternalLink, 
  Mail,
  Github,
  Twitter,
  MessageSquare
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
}

const HelpSection: React.FC<HelpSectionProps> = ({ title, children }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </CardHeader>
      <CardBody>
        {children}
      </CardBody>
    </Card>
  );
};

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
      <h4 className="font-medium text-gray-900 mb-2">{question}</h4>
      <p className="text-gray-600 text-sm">{answer}</p>
    </div>
  );
};

const Help: React.FC = () => {
  const { isConnected } = useWeb3();

  const faqItems = [
    {
      question: "How do I connect my wallet?",
      answer: "Click the 'Connect Wallet' button in the top-right corner and select MetaMask or another compatible Web3 wallet. Approve the connection request in your wallet extension."
    },
    {
      question: "What networks are supported?",
      answer: "TokenBalanceX supports multiple networks including localhost (Hardhat), Sepolia testnet, and Base Sepolia testnet. You can switch between them using the wallet dropdown."
    },
    {
      question: "How are points calculated?",
      answer: "Points are calculated based on your token balance and holding time using the formula: Points = Balance × 0.05 × Holding Hours. Points are calculated hourly and accumulate over time."
    },
    {
      question: "What can I do with tokens?",
      answer: "You can mint new tokens (if you have permissions), burn your existing tokens, and transfer tokens to other addresses using the Contract page."
    },
    {
      question: "How do I check my transaction history?",
      answer: "Visit the Transactions page to view all blockchain events including mints, burns, and transfers. You can filter by event type and export the data."
    },
    {
      question: "What is the leaderboard?",
      answer: "The leaderboard shows the top token holders ranked by their points. It updates in real-time and displays user rankings, balances, and accumulated points."
    },
    {
      question: "How do I report an issue?",
      answer: "If you encounter any issues, please check the browser console for error messages and report them through our GitHub issues page or contact support."
    }
  ];

  const quickLinks = [
    {
      title: "Documentation",
      description: "Read the complete project documentation",
      icon: <Book size={20} />,
      url: "#",
      color: "text-blue-600"
    },
    {
      title: "GitHub Repository",
      description: "View source code and contribute",
      icon: <Github size={20} />,
      url: "#",
      color: "text-gray-900"
    },
    {
      title: "Community Chat",
      description: "Join our community chat",
      icon: <MessageSquare size={20} />,
      url: "#",
      color: "text-indigo-600"
    },
    {
      title: "Twitter Updates",
      description: "Follow for news and updates",
      icon: <Twitter size={20} />,
      url: "#",
      color: "text-blue-400"
    }
  ];

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Connect your wallet to access the help center</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        <p className="text-gray-600 mt-2">Find answers and get support</p>
      </div>

      {/* 快速链接 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardBody className="p-6 text-center">
              <div className={`inline-flex p-3 rounded-lg bg-gray-100 mb-3 ${link.color}`}>
                {link.icon}
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{link.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{link.description}</p>
              <Button variant="outline" size="sm" className="w-full">
                Visit
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 常见问题 */}
      <HelpSection title="Frequently Asked Questions">
        <div className="space-y-0">
          {faqItems.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </div>
      </HelpSection>

      {/* 操作指南 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HelpSection title="Getting Started Guide">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Connect Your Wallet</h5>
                <p className="text-sm text-gray-600">Install MetaMask and connect your Ethereum wallet to the application.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Select Network</h5>
                <p className="text-sm text-gray-600">Choose the appropriate network (localhost for testing, Sepolia for testnet).</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Interact with Contract</h5>
                <p className="text-sm text-gray-600">Use the Contract page to mint, burn, or transfer tokens.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Track Your Progress</h5>
                <p className="text-sm text-gray-600">Monitor your balance, points, and ranking on the Dashboard and Leaderboard.</p>
              </div>
            </div>
          </div>
        </HelpSection>

        <HelpSection title="Troubleshooting">
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Wallet Not Connecting</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ensure MetaMask is installed and unlocked</li>
                <li>• Check that you're on the correct network</li>
                <li>• Try refreshing the page and reconnecting</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Transaction Failed</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check your wallet has sufficient ETH for gas fees</li>
                <li>• Verify you're on the correct network</li>
                <li>• Ensure you have sufficient token balance for transfers</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Data Not Loading</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check the backend server is running</li>
                <li>• Verify API URL in Settings</li>
                <li>• Try refreshing the page or clearing cache</li>
              </ul>
            </div>
          </div>
        </HelpSection>
      </div>

      {/* 联系支持 */}
      <HelpSection title="Contact Support">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex p-3 bg-blue-100 rounded-full mb-3">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Email Support</h4>
            <p className="text-sm text-gray-600 mb-3">Get help via email</p>
            <Button variant="outline" size="sm">
              Send Email
            </Button>
          </div>
          
          <div className="text-center">
            <div className="inline-flex p-3 bg-indigo-100 rounded-full mb-3">
              <MessageCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Live Chat</h4>
            <p className="text-sm text-gray-600 mb-3">Chat with our team</p>
            <Button variant="outline" size="sm">
              Start Chat
            </Button>
          </div>
          
          <div className="text-center">
            <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
              <Github className="w-6 h-6 text-gray-900" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Report Issue</h4>
            <p className="text-sm text-gray-600 mb-3">Report bugs on GitHub</p>
            <Button variant="outline" size="sm">
              Open Issue
            </Button>
          </div>
        </div>
      </HelpSection>
    </div>
  );
};

export default Help;