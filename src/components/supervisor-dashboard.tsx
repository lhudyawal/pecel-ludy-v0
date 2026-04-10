"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

interface SupervisorDashboardProps {
  user: any;
}

export function SupervisorDashboard({ user }: SupervisorDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Supervisor</h1>
        <p className="text-muted-foreground mt-1">Monitoring dan verifikasi tim sales</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Dalam tim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Masuk</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terverifikasi</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Perlu review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang, {user.full_name}!</CardTitle>
          <CardDescription>
            Gunakan dashboard ini untuk memonitor performa tim dan memverifikasi laporan harian sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
              <div>
                <h3 className="font-semibold text-blue-900">Verifikasi Laporan</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Periksa dan verifikasi laporan harian dari sales di bawah koordinasi Anda.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-green-600 mt-2" />
              <div>
                <h3 className="font-semibold text-green-900">Monitor Performa</h3>
                <p className="text-sm text-green-800 mt-1">
                  Pantau pencapaian target setiap sales dan berikan feedback untuk peningkatan.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
              <div>
                <h3 className="font-semibold text-orange-900">Kelola Tim</h3>
                <p className="text-sm text-orange-800 mt-1">
                  Atur target dan gaji pokok untuk setiap sales di tim Anda.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
