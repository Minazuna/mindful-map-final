import React, { useEffect, useState } from "react";
import { Box, Avatar, Typography, TextField, IconButton, Button, Checkbox, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Navbar from './Navbar';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

   const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API Response:", response.data); 
      setUsers(response.data);
      setFilteredUsers(response.data); 
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (user.section && user.section.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSection = sectionFilter === "" || 
                            (sectionFilter === "Not Assigned" && (!user.section || user.section === "Not Assigned")) ||
                            (user.section && user.section === sectionFilter);
      
      return matchesSearch && matchesSection;
    });
    
    setFilteredUsers(filtered);
  }, [searchTerm, sectionFilter, users]);

  const getUniqueSections = () => {
    const sections = users.map(user => user.section || "Not Assigned");
    return ["", ...new Set(sections)].sort();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 25; 
    const logoHeight = 25;
    const margin = 15;
    const lineY = 42;  // Adjusted line position
    
    const tupLogo = new Image();
    const rightLogo = new Image();
    tupLogo.src = '/images/tup.png';
    rightLogo.src = '/images/logo.png';
    
    Promise.all([
      new Promise((resolve, reject) => {
        tupLogo.onload = resolve;
        tupLogo.onerror = reject;
      }),
      new Promise((resolve, reject) => {
        rightLogo.onload = resolve;
        rightLogo.onerror = reject;
      })
    ]).then(() => {
      doc.addImage(tupLogo, 'PNG', margin, 10, logoWidth, logoHeight);
      
      const rightLogoX = pageWidth - margin - logoWidth;
      doc.addImage(rightLogo, 'PNG', rightLogoX, 10, logoWidth, logoHeight);
      
      const textStart = margin + logoWidth + 10;
      const textWidth = rightLogoX - textStart;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const universityName = "TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES-TAGUIG";
      const universityX = textStart + (textWidth - doc.getTextWidth(universityName)) / 2 - 5;
      doc.text(universityName, universityX, 20);
      
      doc.setFontSize(11);
      const program = "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY";
      const programX = textStart + (textWidth - doc.getTextWidth(program)) / 2 - 5;
      doc.text(program, programX, 27);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const address = "Km. 14 East Service Road, Western Bicutan, Taguig City 1630, Metro Manila, Philippines";
      const addressX = textStart + (textWidth - doc.getTextWidth(address)) / 2 - 5;
      doc.text(address, addressX, 34);
      
      // Horizontal line
      doc.setLineWidth(0.6);
      doc.setDrawColor(100, 179, 138);  
      doc.line(35, lineY, pageWidth - 35, lineY);
      
      // Date and Time
      const now = new Date();
      const dateTime = `Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateTime, pageWidth - margin, lineY - 5, { align: 'right' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Users Report", margin, lineY + 20);
      
      // Create users table data
      const usersData = filteredUsers.map(user => [
        user.name || "N/A",
        user.email,
        user.section || "Not Assigned",
        user.status,
        user.lastLogged ? new Date(user.lastLogged).toISOString().slice(0, 10) : "Never",
        user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : "N/A",
      ]);

      doc.autoTable({
        head: [["Name", "Email", "Section", "Status", "Last Logged", "Created At"]],
        body: usersData,
        startY: lineY + 30,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [100, 179, 138],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
        },
      });
      
      doc.save("users_report.pdf");
    }).catch(error => {
      console.error('Error loading images:', error);
    });
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
              Users
            </Typography>

            {/* Controls */}
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Search..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  width: 200,
                  bgcolor: "#F5F5F5",
                  borderRadius: 1,
                }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  label="Section"
                  sx={{
                    bgcolor: "#F5F5F5",
                    borderRadius: 1,
                  }}
                >
                  <MenuItem value="">All Sections</MenuItem>
                  {getUniqueSections().slice(1).map((section) => (
                    <MenuItem key={section} value={section}>
                      {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <IconButton onClick={exportPDF} sx={{ color: "#1976D2" }}>
                <FileDownloadIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Custom Table Implementation */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell width="80px" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Avatar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Section</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Account Status</TableCell>
                  <TableCell width="120px" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Last Logged</TableCell>
                  <TableCell width="120px" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ fontSize: '0.875rem' }}>
                      <Typography sx={{ fontSize: '0.875rem' }}>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ fontSize: '0.875rem' }}>
                      <Typography sx={{ fontSize: '0.875rem' }}>No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow 
                      key={user.id}
                      hover 
                      sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}
                    >
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        <Avatar src={user.avatar} alt="User Avatar" />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{user.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{user.email}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        <Typography
                          sx={{
                            bgcolor: user.section === "Not Assigned" ? '#FFF3E0' : '#E3F2FD',
                            color: user.section === "Not Assigned" ? '#FF9800' : '#1976D2',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            fontSize: '0.875rem'
                          }}
                        >
                          {user.section || 'Not Assigned'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        <Typography
                          sx={{
                            bgcolor: user.status === "Active" ? '#E8F5E9' : '#FFEBEE',
                            color: user.status === "Active" ? '#4CAF50' : '#F44336',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            fontSize: '0.875rem'
                          }}
                        >
                          {user.status}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {user.lastLogged ? new Date(user.lastLogged).toISOString().slice(0, 10) : "Never"}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : "No Date Available"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
   );
};

export default Users;