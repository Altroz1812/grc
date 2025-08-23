
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Download, Upload, Clock, CheckCircle, AlertCircle, HardDrive, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface BackupRecord {
  id: string;
  timestamp: Date;
  type: 'scheduled' | 'manual';
  status: 'completed' | 'running' | 'failed';
  size: string;
  duration: string;
  description: string;
}

interface RestorePoint {
  id: string;
  timestamp: Date;
  description: string;
  tables: string[];
  size: string;
  integrity: 'verified' | 'pending' | 'failed';
}

const BackupManagement: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([
    {
      id: '1',
      timestamp: new Date('2024-01-20T02:00:00'),
      type: 'scheduled',
      status: 'completed',
      size: '245 MB',
      duration: '3m 45s',
      description: 'Daily automated backup'
    },
    {
      id: '2',
      timestamp: new Date('2024-01-19T15:30:00'),
      type: 'manual',
      status: 'completed',
      size: '243 MB',
      duration: '3m 12s',
      description: 'Pre-deployment backup'
    },
    {
      id: '3',
      timestamp: new Date('2024-01-19T02:00:00'),
      type: 'scheduled',
      status: 'completed',
      size: '241 MB',
      duration: '3m 28s',
      description: 'Daily automated backup'
    }
  ]);

  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([
    {
      id: '1',
      timestamp: new Date('2024-01-20T02:00:00'),
      description: 'Pre-compliance-review checkpoint',
      tables: ['compliances', 'employees', 'departments', 'audit_logs'],
      size: '245 MB',
      integrity: 'verified'
    },
    {
      id: '2',
      timestamp: new Date('2024-01-19T15:30:00'),
      description: 'System update checkpoint',
      tables: ['compliances', 'employees', 'departments'],
      size: '243 MB',
      integrity: 'verified'
    }
  ]);

  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const { toast } = useToast();

  const startManualBackup = async () => {
    setIsBackupRunning(true);
    setBackupProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackupRunning(false);
          
          // Add new backup record
          const newBackup: BackupRecord = {
            id: (backups.length + 1).toString(),
            timestamp: new Date(),
            type: 'manual',
            status: 'completed',
            size: '247 MB',
            duration: '3m 52s',
            description: 'Manual backup initiated by user'
          };
          
          setBackups([newBackup, ...backups]);
          
          toast({
            title: "Backup Completed",
            description: "Manual backup has been successfully created",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const createRestorePoint = () => {
    const newRestorePoint: RestorePoint = {
      id: (restorePoints.length + 1).toString(),
      timestamp: new Date(),
      description: 'Manual restore point',
      tables: ['compliances', 'employees', 'departments', 'user_roles', 'audit_logs'],
      size: '247 MB',
      integrity: 'pending'
    };

    setRestorePoints([newRestorePoint, ...restorePoints]);
    
    toast({
      title: "Restore Point Created",
      description: "New restore point has been created for audit integrity",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getIntegrityColor = (integrity: string) => {
    switch (integrity) {
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-blue-50 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="mr-3 h-6 w-6 text-blue-600" />
            Backup Management
          </h1>
          <p className="text-gray-600 mt-1">Manage data backups and restore points for audit integrity</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={createRestorePoint}
            variant="outline"
            className="flex items-center"
          >
            <HardDrive className="mr-2 h-4 w-4" />
            Create Restore Point
          </Button>
          <Button 
            onClick={startManualBackup}
            disabled={isBackupRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            {isBackupRunning ? 'Backing Up...' : 'Manual Backup'}
          </Button>
        </div>
      </div>

      {isBackupRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              Backup in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Creating backup...</span>
                <span className="text-sm font-medium">{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="mr-2 h-5 w-5 text-blue-600" />
              Backup Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Daily Backup</span>
                <Badge className="bg-blue-100 text-blue-800">02:00 AM</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Weekly Full Backup</span>
                <Badge className="bg-blue-100 text-blue-800">Sunday 01:00 AM</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Retention Period</span>
                <span className="text-sm font-medium">90 days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <HardDrive className="mr-2 h-5 w-5 text-blue-600" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Backups</span>
                <span className="text-sm font-medium">{backups.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Storage Used</span>
                <span className="text-sm font-medium">2.4 GB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Available Space</span>
                <span className="text-sm font-medium">47.6 GB</span>
              </div>
              <Progress value={4.8} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
              Backup Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Backup</span>
                <Badge className="bg-blue-100 text-blue-800">Success</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Success Rate</span>
                <span className="text-sm font-medium">99.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Failed Backups</span>
                <span className="text-sm font-medium">0 (Last 30 days)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(backup.status)}
                    <div>
                      <p className="font-medium">{backup.description}</p>
                      <p className="text-sm text-gray-600">
                        {backup.timestamp.toLocaleString()} • {backup.size} • {backup.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(backup.status)}>
                      {backup.status}
                    </Badge>
                    <Badge variant="outline">
                      {backup.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restore Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {restorePoints.map((point) => (
                <div key={point.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{point.description}</p>
                    <Badge className={getIntegrityColor(point.integrity)}>
                      {point.integrity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {point.timestamp.toLocaleString()} • {point.size}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {point.tables.map((table, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button size="sm" variant="outline">
                      <Upload className="mr-1 h-3 w-3" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackupManagement;
