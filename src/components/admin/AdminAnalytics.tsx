import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, TrendingUp, Users, Home, DollarSign } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface MonthlyData {
  month: string;
  users: number;
  properties: number;
}

interface PropertyTypeData {
  name: string;
  value: number;
}

interface CountyData {
  county: string;
  count: number;
  totalValue: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "#8884d8", "#82ca9d"];

export function AdminAnalytics() {
  const [userGrowth, setUserGrowth] = useState<MonthlyData[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeData[]>([]);
  const [countyData, setCountyData] = useState<CountyData[]>([]);
  const [listingStats, setListingStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    rentedListings: 0,
  });
  const [revenueData, setRevenueData] = useState({
    totalValue: 0,
    averagePrice: 0,
    forSaleValue: 0,
    forRentValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch user growth data (last 6 months)
      const userGrowthData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .lte("created_at", monthEnd.toISOString());

        const { count: propCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .lte("created_at", monthEnd.toISOString());

        userGrowthData.push({
          month: format(monthStart, "MMM"),
          users: userCount || 0,
          properties: propCount || 0,
        });
      }
      setUserGrowth(userGrowthData);

      // Fetch property type distribution
      const { data: properties } = await supabase
        .from("properties")
        .select("property_type, listing_type, price_usd, county, status");

      if (properties) {
        // Property types
        const typeCount: Record<string, number> = {};
        properties.forEach((p) => {
          typeCount[p.property_type] = (typeCount[p.property_type] || 0) + 1;
        });
        setPropertyTypes(
          Object.entries(typeCount).map(([name, value]) => ({ name, value }))
        );

        // County data
        const countyStats: Record<string, { count: number; totalValue: number }> = {};
        properties.forEach((p) => {
          if (!countyStats[p.county]) {
            countyStats[p.county] = { count: 0, totalValue: 0 };
          }
          countyStats[p.county].count += 1;
          countyStats[p.county].totalValue += Number(p.price_usd) || 0;
        });
        setCountyData(
          Object.entries(countyStats)
            .map(([county, data]) => ({ county, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        );

        // Listing stats
        const active = properties.filter((p) => p.status === "active").length;
        const sold = properties.filter((p) => p.status === "sold").length;
        const rented = properties.filter((p) => p.status === "rented").length;
        setListingStats({
          totalListings: properties.length,
          activeListings: active,
          soldListings: sold,
          rentedListings: rented,
        });

        // Revenue data
        const forSale = properties.filter((p) => p.listing_type === "for_sale");
        const forRent = properties.filter((p) => p.listing_type === "for_rent");
        const totalValue = properties.reduce((sum, p) => sum + (Number(p.price_usd) || 0), 0);
        setRevenueData({
          totalValue,
          averagePrice: properties.length > 0 ? totalValue / properties.length : 0,
          forSaleValue: forSale.reduce((sum, p) => sum + (Number(p.price_usd) || 0), 0),
          forRentValue: forRent.reduce((sum, p) => sum + (Number(p.price_usd) || 0), 0),
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => row[h]).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllData = async () => {
    const { data: properties } = await supabase
      .from("properties")
      .select("id, title, property_type, listing_type, price_usd, county, status, created_at");
    
    if (properties) {
      exportToCSV(properties, `properties-export-${format(new Date(), "yyyy-MM-dd")}`);
    }
  };

  const exportUserData = async () => {
    const { data: users } = await supabase
      .from("profiles")
      .select("id, name, email, role, verification_status, county, created_at");
    
    if (users) {
      exportToCSV(users, `users-export-${format(new Date(), "yyyy-MM-dd")}`);
    }
  };

  const chartConfig = {
    users: { label: "Users", color: "hsl(var(--primary))" },
    properties: { label: "Properties", color: "hsl(var(--secondary))" },
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={exportAllData} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Properties (CSV)
        </Button>
        <Button onClick={exportUserData} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Users (CSV)
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Listings Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">Per listing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">For Sale Value</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData.forSaleValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Properties for sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">For Rent Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData.forRentValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly rental listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User & Property Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="properties" stroke="hsl(var(--secondary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Property Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Property Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={propertyTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {propertyTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* County Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Listings by County</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countyData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="county" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Listing Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Listing Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{listingStats.totalListings}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{listingStats.activeListings}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{listingStats.soldListings}</div>
              <div className="text-sm text-muted-foreground">Sold</div>
            </div>
            <div className="text-center p-4 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{listingStats.rentedListings}</div>
              <div className="text-sm text-muted-foreground">Rented</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
