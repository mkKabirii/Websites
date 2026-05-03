import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper, Button } from "@mui/material";
import { ArrowRight, RotateCcw } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import { DynamicLineChart } from "../../components/charts";
import { DateRangeFilter } from "../../components";
import { DashboardSkeleton } from "../../components/skeleton";
import useUserStore from "../../zustand/useUserStore";
import { getDashboardData } from "../../api/module/dashboard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  // Permissions for Dashboard route "/"
  const perms = useUserStore((s) => s.getRoutePermissions("/"));
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 
  // Date range filter state
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    hasRange: false,
  });

  // Table configurations
  const eventsTableHeaders = [
    { id: "index", title: "ID", align: "center" },
    { id: "title", title: "Event Title", align: "center" },
    { id: "eventDate", title: "Date", align: "center" },
    { id: "location", title: "Location", align: "center" },
  ];

  const servicesTableHeaders = [
    { id: "serviceId", title: "ID", align: "center" },
    { id: "title", title: "Service Name", align: "center" },
    { id: "proposalCount", title: "Proposals", align: "center" },
  ];

  const proposalsTableHeaders = [
    { id: "proposalId", title: "Proposal ID", align: "center" },
    { id: "fullname", title: "Name", align: "center" },
    { id: "email", title: "Email", align: "center" },
    { id: "budget", title: "Budget", align: "center" },
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.hasRange && dateRange.startDate 
        ? new Date(dateRange.startDate).toISOString().split('T')[0] 
        : null;
      const endDate = dateRange.hasRange && dateRange.endDate 
        ? new Date(dateRange.endDate).toISOString().split('T')[0] 
        : null;
      
      const response = await getDashboardData(startDate, endDate);
      if (response.status === 200 || response.status === 201) {
        setDashboardData(response.data?.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Handler functions
  const handleViewAll = (type) => {
    console.log(`View all ${type}`);
    // Yahan aap navigation add kar sakte hain
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleResetFilter = () => {
    setDateRange({
      startDate: null,
      endDate: null,
      hasRange: false,
    });
  };

  // Format data for tables
  const formatEventsData = (events) => {
    if (!events) return [];
    return events.map((event) => ({
      ...event,
      eventDate: event.eventDate
        ? new Date(event.eventDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A",
    }));
  };

  // Format proposals over time for chart
  const formatProposalsData = (proposals) => {
    if (!proposals) return [];
    return proposals.map((item) => ({
      date: item.date,
      value: item.count,
      budget: item.totalBudget,
    }));
  };

  // Format proposals data for table
  const formatProposalsTableData = (proposals) => {
    if (!proposals) return [];
    return proposals.map((proposal) => ({
      ...proposal,
      budget: proposal.budget ? `$${Number(proposal.budget).toLocaleString()}` : "N/A",
    }));
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3, backgroundColor: "transparent", minHeight: "100vh" }}>
        <Typography sx={{ color: "#FFFFFF" }}>No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, backgroundColor: "transparent", minHeight: "100vh" }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "flex-start" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "#FFFFFF",
                fontWeight: 700,
                mb: 1,
                background: "linear-gradient(135deg, #8CE600 0%, #00D4AA 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Dashboard Overview
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#B0B0B0", fontSize: "16px" }}
            >
              Welcome to your admin dashboard. Monitor your business performance
              and manage operations.
            </Typography>
          </Box>

          {/* Date Range Filter */}
          <Box sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
            <DateRangeFilter
              onDateRangeChange={handleDateRangeChange}
              placeholder="Filter by Date Range"
              showClearButton={true}
              showFilterButton={true}
            />
            {dateRange.hasRange && (
              <Button
                variant="outlined"
                startIcon={<RotateCcw size={16} />}
                onClick={handleResetFilter}
                sx={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333333",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "#2A2A2A",
                    borderColor: "#8CE600",
                    color: "#8CE600",
                  },
                }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Charts Section */}
      {dashboardData.proposalsOverTime && dashboardData.proposalsOverTime.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item size={{ xs: 12 }}>
            <Paper
              sx={{
                backgroundColor: "#1A1A1A",
                borderRadius: "16px",
                p: 3,
                border: "1px solid #333333",
              }}
            >
              <DynamicLineChart
                data={formatProposalsData(dashboardData.proposalsOverTime)}
                title="Proposals Over Time"
                seriesName="Proposals"
                valueField="value"
                categoryField="date"
                valueLabel="Proposals"
                showBudget={true}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tables Section */}
      <Grid container spacing={3}>
        {/* Top 5 Proposals Table */}
        {dashboardData.topProposals && dashboardData.topProposals.length > 0 && (
          <Grid item size={{ xs: 12 }}>
            <Paper
              sx={{
                backgroundColor: "#1A1A1A",
                borderRadius: "16px",
                p: 3,
                border: "1px solid #333333",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 600,
                  }}
                >
                  Top 5 Proposals
                </Typography>
                {perms?.isViewAllProposals && (
                  <Button
                    variant="text"
                    endIcon={<ArrowRight size={16} />}
                    onClick={() => navigate("/proposals")}
                    sx={{
                      color: "#8CE600",
                      fontSize: "14px",
                      fontWeight: 500,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "rgba(140, 230, 0, 0.1)",
                      },
                    }}
                  >
                    View All
                  </Button>
                )}
              </Box>

              <PaginatedTable
                tableWidth="100%"
                tableHeader={proposalsTableHeaders}
                tableData={formatProposalsTableData(dashboardData.topProposals)}
                displayRows={["proposalId", "fullname", "email", "budget"]}
                isLoading={loading}
                showPagination={false}
              />
            </Paper>
          </Grid>
        )}

        {/* Top Services Table */}
        {dashboardData.topServices && dashboardData.topServices.length > 0 && (
          <Grid item size={{ xs: 12, lg: 6 }}>
            <Paper
              sx={{
                backgroundColor: "#1A1A1A",
                borderRadius: "16px",
                p: 3,
                border: "1px solid #333333",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 600,
                  }}
                >
                  Top Services
                </Typography>
                {perms?.isViewAllServices && (
                  <Button
                    variant="text"
                    endIcon={<ArrowRight size={16} />}
                    onClick={() => navigate("/services")}
                    sx={{
                      color: "#8CE600",
                      fontSize: "14px",
                      fontWeight: 500,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "rgba(140, 230, 0, 0.1)",
                      },
                    }}
                  >
                    View All
                  </Button>
                )}
              </Box>

              <PaginatedTable
                tableWidth="100%"
                tableHeader={servicesTableHeaders}
                tableData={dashboardData.topServices}
                displayRows={["id", "title", "proposalCount"]}
                isLoading={loading}
                showPagination={false}
              />
            </Paper>
          </Grid>
        )}

        {/* Upcoming Events Table */}
        {dashboardData.topUpcomingEvents && dashboardData.topUpcomingEvents.length > 0 && (
          <Grid item size={{ xs: 12, lg: 6 }}>
            <Paper
              sx={{
                backgroundColor: "#1A1A1A",
                borderRadius: "16px",
                p: 3,
                border: "1px solid #333333",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 600,
                  }}
                >
                  Upcoming Events
                </Typography>
                {perms?.isViewAllUpcomingEvents && (
                  <Button
                    variant="text"
                    endIcon={<ArrowRight size={16} />}
                    onClick={() => navigate("/gallery")}
                    sx={{
                      color: "#8CE600",
                      fontSize: "14px",
                      fontWeight: 500,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "rgba(140, 230, 0, 0.1)",
                      },
                    }}
                  >
                    View All
                  </Button>
                )}
              </Box>

              <PaginatedTable
                tableWidth="100%"
                tableHeader={eventsTableHeaders}
                tableData={formatEventsData(dashboardData.topUpcomingEvents)}
                displayRows={["id", "title", "eventDate", "location"]}
                isLoading={loading}
                showPagination={false}
              />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
