
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Rocket, Server, AlertTriangle, CheckCircle, Clock, Settings, Bell, GitBranch } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Environment {
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  url: string;
  version: string;
  lastDeployed: Date;
  health: 'healthy' | 'warning' | 'critical';
}

interface Deployment {
  id: string;
  environment: string;
  version: string;
  status: 'success' | 'failed' | 'pending' | 'running';
  timestamp: Date;
  deployedBy: string;
  duration: string;
  notes: string;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  environment: string;
  scheduledStart: Date;
  duration: string;
  description: string;
  status: 'scheduled' | 'active' | 'completed';
}

const DeploymentManagement: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([
    {
      name: 'Production',
      status: 'online',
      url: 'https://compliance.bank.com',
      version: 'v2.1.3',
      lastDeployed: new Date('2024-01-20T08:00:00'),
      health: 'healthy'
    },
    {
      name: 'Staging',
      status: 'online',
      url: 'https://staging.compliance.bank.com',
      version: 'v2.2.0-beta',
      lastDeployed: new Date('2024-01-20T14:30:00'),
      health: 'healthy'
    },
    {
      name: 'Development',
      status: 'online',
      url: 'https://dev.compliance.bank.com',
      version: 'v2.2.1-dev',
      lastDeployed: new Date('2024-01-20T16:45:00'),
      health: 'warning'
    }
  ]);

  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: '1',
      environment: 'Production',
      version: 'v2.1.3',
      status: 'success',
      timestamp: new Date('2024-01-20T08:00:00'),
      deployedBy: 'admin@bank.com',
      duration: '4m 32s',
      notes: 'Security patches and bug fixes'
    },
    {
      id: '2',
      environment: 'Staging',
      version: 'v2.2.0-beta',
      status: 'success',
      timestamp: new Date('2024-01-20T14:30:00'),
      deployedBy: 'dev@bank.com',
      duration: '3m 45s',
      notes: 'New compliance reporting features'
    }
  ]);

  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([
    {
      id: '1',
      title: 'Database Maintenance',
      environment: 'Production',
      scheduledStart: new Date('2024-01-25T02:00:00'),
      duration: '2 hours',
      description: 'Scheduled database optimization and index maintenance',
      status: 'scheduled'
    },
    {
      id: '2',
      title: 'Security Updates',
      environment: 'Staging',
      scheduledStart: new Date('2024-01-22T18:00:00'),
      duration: '1 hour',
      description: 'Apply latest security patches and updates',
      status: 'scheduled'
    }
  ]);

  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentNotes, setDeploymentNotes] = useState('');
  const { toast } = useToast();

  const startDeployment = async (environment: string) => {
    setIsDeploying(true);
    setDeploymentProgress(0);

    const interval = setInterval(() => {
      setDeploymentProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDeploying(false);
          
          const newDeployment: Deployment = {
            id: (deployments.length + 1).toString(),
            environment,
            version: 'v2.2.1',
            status: 'success',
            timestamp: new Date(),
            deployedBy: 'admin@bank.com',
            duration: '4m 12s',
            notes: deploymentNotes || 'Manual deployment'
          };
          
          setDeployments([newDeployment, ...deployments]);
          setDeploymentNotes('');
          
          toast({
            title: "Deployment Successful",
            description: `Successfully deployed to ${environment}`,
          });
          
          return 100;
        }
        return prev + 12.5;
      });
    }, 500);
  };

  const scheduleMaintenanceAlert = (window: MaintenanceWindow) => {
    toast({
      title: "Maintenance Alert Scheduled",
      description: `Users will be notified about ${window.title} maintenance`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'success': case 'healthy': return 'bg-blue-100 text-blue-800';
      case 'offline': case 'failed': case 'critical': return 'bg-red-100 text-red-800';
      case 'maintenance': case 'pending': case 'warning': return 'bg-blue-50 text-blue-700';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': case 'success': case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'offline': case 'failed': case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': case 'pending': case 'warning': return <Clock className="h-4 w-4" />;
      case 'running': return <Settings className="h-4 w-4 animate-spin" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Rocket className="mr-3 h-6 w-6 text-blue-600" />
            Deployment Management
          </h1>
          <p className="text-gray-600 mt-1">Manage environments, deployments, and maintenance schedules</p>
        </div>
      </div>

      {isDeploying && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="mr-2 h-5 w-5 text-blue-600 animate-spin" />
              Deployment in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Deploying to production...</span>
                <span className="text-sm font-medium">{deploymentProgress}%</span>
              </div>
              <Progress value={deploymentProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="environments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="updates">System Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="environments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {environments.map((env, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <Server className="mr-2 h-5 w-5 text-blue-600" />
                      {env.name}
                    </div>
                    <Badge className={getStatusColor(env.status)}>
                      {env.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Version</span>
                      <span className="text-sm font-medium">{env.version}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Health</span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(env.health)}
                        <Badge className={getStatusColor(env.health)}>
                          {env.health}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Deployed</span>
                      <span className="text-sm">{env.lastDeployed.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <a 
                      href={env.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block truncate"
                    >
                      {env.url}
                    </a>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        variant={env.name === 'Production' ? 'default' : 'outline'}
                        disabled={isDeploying}
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy to {env.name}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deploy to {env.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="deployment-notes">Deployment Notes</Label>
                          <Textarea
                            id="deployment-notes"
                            placeholder="Enter deployment notes (optional)"
                            value={deploymentNotes}
                            onChange={(e) => setDeploymentNotes(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={() => startDeployment(env.name)}
                          className="w-full"
                          disabled={isDeploying}
                        >
                          Start Deployment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployments.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <p className="font-medium">{deployment.environment} - {deployment.version}</p>
                        <p className="text-sm text-gray-600">
                          {deployment.timestamp.toLocaleString()} by {deployment.deployedBy}
                        </p>
                        <p className="text-sm text-gray-500">{deployment.notes}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(deployment.status)}>
                        {deployment.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{deployment.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Maintenance Windows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceWindows.map((window) => (
                  <div key={window.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{window.title}</h3>
                      <Badge className={getStatusColor(window.status)}>
                        {window.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Environment:</strong> {window.environment}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Scheduled:</strong> {window.scheduledStart.toLocaleString()} ({window.duration})
                      </p>
                      <p className="text-sm text-gray-600">{window.description}</p>
                    </div>
                    <div className="flex justify-end mt-3 space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => scheduleMaintenanceAlert(window)}
                      >
                        <Bell className="mr-1 h-3 w-3" />
                        Send Alert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <GitBranch className="mr-2 h-5 w-5 text-blue-600" />
                  System Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Security Patch v2.1.4</p>
                      <p className="text-sm text-gray-600">Critical security updates</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Critical</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Feature Update v2.2.0</p>
                      <p className="text-sm text-gray-600">New compliance features</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Ready</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Performance Update v2.1.3</p>
                      <p className="text-sm text-gray-600">Database optimizations</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Applied</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Updates</span>
                    <Badge className="bg-blue-100 text-blue-800">Auto-Applied</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Feature Updates</span>
                    <Badge className="bg-blue-50 text-blue-700">Manual Review</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Next Check</span>
                    <span className="text-sm font-medium">Daily at 3:00 AM</span>
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

export default DeploymentManagement;
