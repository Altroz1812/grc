
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Key, Eye, EyeOff, Smartphone, Lock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordPolicy: {
    minLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    expiryDays: number;
  };
  sessionTimeout: number;
  maxLoginAttempts: number;
}

interface OTPSession {
  id: string;
  email: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
}

const SecurityDashboard: React.FC = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      expiryDays: 90,
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });

  const [otpCode, setOtpCode] = useState('');
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ email: 'admin@bank.com', role: 'Compliance Officer' });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Mock data for demonstration
  const [securityLogs, setSecurityLogs] = useState([
    {
      id: '1',
      timestamp: new Date('2024-01-20T10:30:00'),
      event: 'Login Success',
      user: 'john.doe@bank.com',
      ipAddress: '192.168.1.100',
      severity: 'info' as const
    },
    {
      id: '2',
      timestamp: new Date('2024-01-20T11:15:00'),
      event: 'Failed Login Attempt',
      user: 'unknown@external.com',
      ipAddress: '203.0.113.45',
      severity: 'warning' as const
    },
    {
      id: '3',
      timestamp: new Date('2024-01-20T12:00:00'),
      event: '2FA Code Generated',
      user: 'sarah.wilson@bank.com',
      ipAddress: '192.168.1.105',
      severity: 'info' as const
    }
  ]);

  const generateOTP = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    toast({
      title: "OTP Generated",
      description: `Verification code sent to ${currentUser.email}`,
    });
    return code;
  };

  const verifyOTP = (inputCode: string) => {
    if (inputCode === otpCode) {
      toast({
        title: "OTP Verified",
        description: "Two-factor authentication successful",
      });
      setIsOtpDialogOpen(false);
      return true;
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please check the code and try again",
        variant: "destructive",
      });
      return false;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-blue-50 text-blue-700';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-blue-600" />
            Security Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage access control, authentication, and security monitoring</p>
        </div>
      </div>

      <Tabs defaultValue="access-control" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="access-control">Access Control</TabsTrigger>
          <TabsTrigger value="two-factor">2FA Settings</TabsTrigger>
          <TabsTrigger value="security-logs">Security Logs</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="access-control" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Key className="mr-2 h-5 w-5 text-blue-600" />
                  Role-Based Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Admin Access</span>
                    <Badge className="bg-red-100 text-red-800">Full Access</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compliance Officer</span>
                    <Badge className="bg-blue-50 text-blue-700">Review & Approve</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Maker</span>
                    <Badge className="bg-blue-100 text-blue-800">Create & Submit</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Viewer</span>
                    <Badge className="bg-gray-100 text-gray-800">Read Only</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Lock className="mr-2 h-5 w-5 text-blue-600" />
                  Encrypted Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Encryption</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PII Protection</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Document Encryption</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transit Encryption</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Eye className="mr-2 h-5 w-5 text-blue-600" />
                  Session Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Session Timeout</span>
                    <span className="text-sm font-medium">{securitySettings.sessionTimeout} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Max Login Attempts</span>
                    <span className="text-sm font-medium">{securitySettings.maxLoginAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Sessions</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="two-factor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Smartphone className="mr-2 h-5 w-5 text-blue-600" />
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">OTP Authentication</h3>
                  <p className="text-sm text-gray-600">Secure login with one-time passwords</p>
                </div>
                <Badge className={securitySettings.twoFactorEnabled ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                  {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Current User: {currentUser.email}</Label>
                  <p className="text-sm text-gray-600">Role: {currentUser.role}</p>
                </div>

                <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={generateOTP}>
                      Generate OTP for Testing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enter OTP Code</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">OTP sent to:</p>
                        <p className="font-medium">{currentUser.email}</p>
                        <p className="text-xs text-gray-500 mt-2">Demo Code: {otpCode}</p>
                      </div>
                      <div>
                        <Label htmlFor="otp-input">Enter 6-digit code</Label>
                        <Input
                          id="otp-input"
                          placeholder="000000"
                          maxLength={6}
                          onChange={(e) => {
                            if (e.target.value.length === 6) {
                              verifyOTP(e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getSeverityIcon(log.severity)}
                      <div>
                        <p className="font-medium">{log.event}</p>
                        <p className="text-sm text-gray-600">
                          {log.user} from {log.ipAddress}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {log.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Length</Label>
                  <Input 
                    type="number" 
                    value={securitySettings.passwordPolicy.minLength}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        minLength: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Password Expiry (Days)</Label>
                  <Input 
                    type="number" 
                    value={securitySettings.passwordPolicy.expiryDays}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        expiryDays: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Require Special Characters</span>
                  <Badge className={securitySettings.passwordPolicy.requireSpecialChars ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                    {securitySettings.passwordPolicy.requireSpecialChars ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Require Numbers</span>
                  <Badge className={securitySettings.passwordPolicy.requireNumbers ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                    {securitySettings.passwordPolicy.requireNumbers ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
