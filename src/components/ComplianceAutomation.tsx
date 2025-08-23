
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Bot } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface APIIntegration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: Date;
  totalSubmissions: number;
  successRate: number;
}

interface MLPrediction {
  id: string;
  complianceId: string;
  complianceName: string;
  delayProbability: number;
  riskScore: number;
  factors: string[];
  recommendedAction: string;
  confidence: number;
}

interface EmployeeRiskScore {
  employeeId: string;
  name: string;
  department: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  completionRate: number;
}

const ComplianceAutomation: React.FC = () => {
  const [apiIntegrations, setApiIntegrations] = useState<APIIntegration[]>([
    {
      id: '1',
      name: 'RBI XBRL Gateway',
      status: 'connected',
      lastSync: new Date('2024-01-20T09:00:00'),
      totalSubmissions: 245,
      successRate: 98.5
    },
    {
      id: '2',
      name: 'FIU-IND Portal',
      status: 'connected',
      lastSync: new Date('2024-01-20T08:30:00'),
      totalSubmissions: 156,
      successRate: 99.2
    },
    {
      id: '3',
      name: 'SEBI Compliance API',
      status: 'disconnected',
      lastSync: new Date('2024-01-19T15:00:00'),
      totalSubmissions: 89,
      successRate: 97.8
    }
  ]);

  const [predictions, setPredictions] = useState<MLPrediction[]>([
    {
      id: '1',
      complianceId: 'RBI001',
      complianceName: 'Suspicious Transaction Report (STR)',
      delayProbability: 75,
      riskScore: 8.2,
      factors: ['High workload', 'Complex cases', 'Staff shortage'],
      recommendedAction: 'Allocate additional resources and prioritize review',
      confidence: 87
    },
    {
      id: '2',
      complianceId: 'RBI002',
      complianceName: 'Asset Liability Management Return',
      delayProbability: 25,
      riskScore: 3.4,
      factors: ['Regular schedule', 'Automated process'],
      recommendedAction: 'Continue with current process',
      confidence: 92
    },
    {
      id: '3',
      complianceId: 'RBI003',
      complianceName: 'NPA Classification Report',
      delayProbability: 60,
      riskScore: 6.8,
      factors: ['Data dependency', 'Manual verification required'],
      recommendedAction: 'Implement automated data validation',
      confidence: 78
    }
  ]);

  const [employeeRiskScores, setEmployeeRiskScores] = useState<EmployeeRiskScore[]>([
    {
      employeeId: 'EMP001',
      name: 'John Doe',
      department: 'Credit Risk Management',
      riskScore: 7.5,
      riskLevel: 'high',
      factors: ['Frequent delays', 'High complexity assignments'],
      completionRate: 78
    },
    {
      employeeId: 'EMP002',
      name: 'Jane Smith',
      department: 'Treasury Operations',
      riskScore: 3.2,
      riskLevel: 'low',
      factors: ['Consistent performance', 'On-time submissions'],
      completionRate: 96
    },
    {
      employeeId: 'EMP003',
      name: 'Mike Johnson',
      department: 'Finance & Accounts',
      riskScore: 5.8,
      riskLevel: 'medium',
      factors: ['Occasional delays', 'Quality issues'],
      completionRate: 85
    }
  ]);

  const { toast } = useToast();

  const triggerAPISync = (apiId: string) => {
    const updatedApis = apiIntegrations.map(api => 
      api.id === apiId 
        ? { ...api, lastSync: new Date(), status: 'connected' as const }
        : api
    );
    setApiIntegrations(updatedApis);
    
    toast({
      title: "API Sync Triggered",
      description: "Compliance data synchronization initiated",
    });
  };

  const runMLAnalysis = () => {
    toast({
      title: "ML Analysis Started",
      description: "Running predictive analysis on compliance patterns",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-blue-100 text-blue-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-blue-50 text-blue-700';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bot className="mr-3 h-6 w-6 text-blue-600" />
            Compliance Automation
          </h1>
          <p className="text-gray-600 mt-1">Advanced automation with API integration and ML predictions</p>
        </div>
        
        <Button onClick={runMLAnalysis} className="bg-purple-600 hover:bg-purple-700">
          <Brain className="mr-2 h-4 w-4" />
          Run ML Analysis
        </Button>
      </div>

      <Tabs defaultValue="api-integration" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-integration">API Integration</TabsTrigger>
          <TabsTrigger value="ml-predictions">ML Predictions</TabsTrigger>
          <TabsTrigger value="risk-scoring">Risk Scoring</TabsTrigger>
        </TabsList>

        <TabsContent value="api-integration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apiIntegrations.map((api) => (
              <Card key={api.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <Zap className="mr-2 h-5 w-5 text-blue-600" />
                      {api.name}
                    </div>
                    <Badge className={getStatusColor(api.status)}>
                      {api.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Sync</span>
                      <span className="text-sm">{api.lastSync.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Submissions</span>
                      <span className="text-sm font-medium">{api.totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm font-medium">{api.successRate}%</span>
                    </div>
                  </div>
                  
                  <Progress value={api.successRate} className="w-full" />
                  
                  <Button 
                    onClick={() => triggerAPISync(api.id)}
                    variant={api.status === 'connected' ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {api.status === 'connected' ? 'Sync Now' : 'Reconnect'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">2</p>
                  <p className="text-sm text-gray-600">Connected APIs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">1</p>
                  <p className="text-sm text-gray-600">Disconnected APIs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">490</p>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">98.2%</p>
                  <p className="text-sm text-gray-600">Overall Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml-predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.map((prediction) => (
              <Card key={prediction.id}>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Brain className="mr-2 h-5 w-5 text-purple-600" />
                    {prediction.complianceName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{prediction.delayProbability}%</p>
                      <p className="text-sm text-gray-600">Delay Probability</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{prediction.riskScore}/10</p>
                      <p className="text-sm text-gray-600">Risk Score</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Risk Factors:</h4>
                    <div className="flex flex-wrap gap-1">
                      {prediction.factors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Recommended Action:</h4>
                    <p className="text-sm text-gray-700">{prediction.recommendedAction}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={prediction.confidence} className="w-16" />
                      <span className="text-sm font-medium">{prediction.confidence}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risk-scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Target className="mr-2 h-5 w-5 text-blue-600" />
                Employee Risk Scoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeRiskScores.map((employee) => (
                  <div key={employee.employeeId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.department}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRiskIcon(employee.riskLevel)}
                        <Badge className={getRiskColor(employee.riskLevel)}>
                          {employee.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Risk Score</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={employee.riskScore * 10} className="flex-1" />
                          <span className="text-sm font-medium">{employee.riskScore}/10</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={employee.completionRate} className="flex-1" />
                          <span className="text-sm font-medium">{employee.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1 text-sm">Risk Factors:</h4>
                      <div className="flex flex-wrap gap-1">
                        {employee.factors.map((factor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Completion Rate</span>
                    <span className="text-sm font-medium">86.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">On-time Submissions</span>
                    <span className="text-sm font-medium">78.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quality Score</span>
                    <span className="text-sm font-medium">92.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Low Risk
                    </span>
                    <span className="text-sm font-medium">15 employees</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      Medium Risk
                    </span>
                    <span className="text-sm font-medium">8 employees</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      High Risk
                    </span>
                    <span className="text-sm font-medium">3 employees</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ML Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prediction Accuracy</span>
                    <span className="text-sm font-medium">84.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Model Confidence</span>
                    <span className="text-sm font-medium">92.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Training</span>
                    <span className="text-sm font-medium">2 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceAutomation;
