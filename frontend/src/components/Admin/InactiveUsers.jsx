import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, IconButton, Button, Avatar, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Navbar from './Navbar';
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const InactiveUsers = () => {
  const theme = useTheme();
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchInactiveUsers = async () => {
      try {
        const token = localStorage.getItem("token");
      
        await axios.post(
          `${import.meta.env.VITE_NODE_API}/api/admin/check-expired-grace-periods`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Then fetch the updated user list
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/inactive-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const userData = response.data.map(user => ({
            ...user,
            hasRequestedReactivation: user.hasRequestedReactivation === true
          }));
          
        setInactiveUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error("Error fetching inactive users:", error);
        toast.error("Failed to load inactive users");
      } finally {
        setLoading(false);
      }
    };

    fetchInactiveUsers();
  }, []);

  useEffect(() => {
    const filtered = inactiveUsers.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, inactiveUsers]);

  const handleDeactivate = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/admin/soft-delete`, 
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the user status in the UI
      setInactiveUsers(inactiveUsers.map(user => 
        user.id === userId ? { 
          ...user, 
          pendingDeactivation: true,
          deactivateAt: response.data.deactivateAt 
        } : user
      ));
      
      toast.success("User deactivation initiated. User has 24 hours to log in.");
    } catch (error) {
      console.error("Error during deactivation:", error);
      toast.error(error.response?.data?.message || "Error during deactivation. Please try again.");
    }
  };

  const handleReactivate = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/admin/reactivate`, 
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the user status in the UI
      setInactiveUsers(inactiveUsers.map(user => 
        user.id === userId ? { 
          ...user, 
          isDeactivated: false, 
          hasRequestedReactivation: false,
          pendingDeactivation: false,
          deactivateAt: null
        } : user
      ));
      
      toast.success("User reactivated successfully!");
    } catch (error) {
      console.error("Error during reactivation:", error);
      toast.error(error.response?.data?.message || "Error during reactivation. Please try again.");
    }
  };

  const getUserStatus = (user) => {
    if (user.isDeactivated) {
      return { label: 'Deactivated', color: '#F44336', bgColor: '#FFEBEE' };
    } else if (user.pendingDeactivation) {
      return { label: 'Pending Deactivation', color: '#673AB7', bgColor: '#EDE7F6' }; 
    } else {
      return { label: 'Inactive', color: '#FB8C00', bgColor: '#FFF3E0' };
    }
  };

  const getRemainingTime = (deactivateAt) => {
    if (!deactivateAt) return null;
    
    const now = new Date();
    const deactivateTime = new Date(deactivateAt);
    const diffMs = deactivateTime - now;
    
    if (diffMs <= 0) return "Expired";
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAF9" }}>
      {/* Sidebar */}
      <Box sx={{ width: 240, flexShrink: 0 }}>
        <Navbar />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          py: 3,
          bgcolor: "#F8FAF9",
        }}
      >
        {/* Table Container */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1100px",
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            boxShadow: 3,
            margin: "0 auto",
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
              Inactive Users
            </Typography>

            {/* Search */}
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Search..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  width: 280,
                  bgcolor: "#F5F5F5",
                  borderRadius: 1,
                }}
              />
            </Box>
          </Box>

          {/* Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table aria-label="inactive users table">
              <TableHead>
                <TableRow>
                  <TableCell width="80px" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Avatar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Reactivation Request</TableCell>
                  <TableCell width="100px" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography>No inactive users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => {
                    const status = getUserStatus(user);
                    return (
                      <TableRow 
                        key={user.id}
                        hover 
                        sx={{
                          borderBottom: '1px solid #E0E0E0',
                          '&:hover': { bgcolor: '#FAFAFA' }
                        }}
                      >
                        <TableCell>
                          <Avatar src={user.avatar} alt="User Avatar" />
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                bgcolor: status.bgColor,
                                color: status.color,
                                px: 2,
                                py: 0.5,
                                borderRadius: 1,
                                display: 'inline-block'
                              }}
                            >
                              {status.label}
                            </Typography>
                            
                            {user.pendingDeactivation && (
                              <Typography color="text.secondary" sx={{ fontSize: '0.8rem', ml: 1 }}>
                                {getRemainingTime(user.deactivateAt)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {user.hasRequestedReactivation ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckIcon sx={{ color: '#4CAF50' }} />
                              <Typography color="primary" sx={{ fontWeight: 'medium' }}>
                                Requested Reactivation
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CloseIcon sx={{ color: '#F44336' }} />
                              <Typography color="text.secondary">No Request</Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isDeactivated && user.hasRequestedReactivation ? (
                            <IconButton onClick={() => handleReactivate(user.id)} title="Restore user account">
                              <RestoreIcon sx={{ color: "#4CAF50" }} />
                            </IconButton>
                          ) : user.pendingDeactivation ? (
                            <Typography variant="caption" color="text.secondary">Pending</Typography>
                          ) : !user.isDeactivated ? (
                            <IconButton onClick={() => handleDeactivate(user.id)} title="Deactivate user">
                              <DeleteIcon sx={{ color: "#F44336" }} />
                            </IconButton>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Awaiting Request</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default InactiveUsers;