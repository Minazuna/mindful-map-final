import React, { useEffect, useState } from "react";
import { Box, Avatar, Typography, TextField, IconButton, Button, Checkbox, Select, MenuItem, FormControl, InputLabel, TablePagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import axios from "axios";
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    setPage(0); // Reset to first page on filter change
  }, [searchTerm, sectionFilter, users]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
    const lineY = 42; 
    
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
      
      doc.setLineWidth(0.6);
      doc.setDrawColor(100, 179, 138);  
      doc.line(35, lineY, pageWidth - 35, lineY);
      
      const now = new Date();
      const dateTime = `Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
      doc.setFontSize(10);
      doc.text(dateTime, pageWidth - margin, lineY - 5, { align: 'right' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Users Report", margin, lineY + 20);
      
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
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [100, 179, 138], textColor: 255, fontSize: 10, fontStyle: 'bold' },
      });
      doc.save("users_report.pdf");
    }).catch(error => console.error('Error loading images:', error));
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAF9" }}>
      <Navbar />

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          ml: 'var(--sidebar-width)',
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh", 
          py: 3,
          px: 4,
          bgcolor: "#F8FAF9",
          transition: 'all 0.3s ease-in-out',
          overflowX: 'auto',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1f2937', mb: 1, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            User Management
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#4b5563', fontWeight: 500 }}>
            Manage and monitor student accounts
          </Typography>
        </Box>
        <Paper
          sx={{
            width: "100%", 
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            boxShadow: 3,
            overflowX: 'auto'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Search..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: 200, bgcolor: "#F5F5F5", borderRadius: 1 }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  label="Section"
                  sx={{ bgcolor: "#F5F5F5", borderRadius: 1 }}
                >
                  <MenuItem value="">All Sections</MenuItem>
                  {getUniqueSections().slice(1).map((section) => (
                    <MenuItem key={section} value={section}>{section}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <IconButton onClick={exportPDF} sx={{ color: "#1976D2" }}>
                <FileDownloadIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Custom Table Implementation */}
          <TableContainer>
            <Table aria-label="users table">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell width="80px" sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 1.5 }}>Avatar</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 1.5 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 1.5 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 1.5 }}>Section</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 1.5 }}>Status</TableCell>
                  <TableCell width="140px" sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2 }}>Last Logged</TableCell>
                  <TableCell width="140px" sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2 }}>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ fontSize: '1rem', py: 4 }}>
                      <Typography sx={{ fontSize: '1rem', color: '#6b7280' }}>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ fontSize: '1rem', py: 4 }}>
                      <Typography sx={{ fontSize: '1rem', color: '#6b7280' }}>No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map(user => (
                    <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: '#FDFDFD' } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Avatar src={user.avatar} alt="User Avatar" sx={{ width: 44, height: 44, border: '2px solid #E5E7EB' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#374151', py: 1.5 }}>{user.name}</TableCell>
                      <TableCell sx={{ fontSize: '1rem', color: '#4b5563', py: 1.5 }}>{user.email}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography
                          sx={{
                            bgcolor: user.section === "Not Assigned" ? '#FEF3C7' : '#DBEAFE',
                            color: user.section === "Not Assigned" ? '#92400E' : '#1E40AF',
                            px: 2, py: 0.75, borderRadius: '8px', display: 'inline-block', fontSize: '0.9rem', fontWeight: 700
                          }}
                        >
                          {user.section || 'Not Assigned'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography
                          sx={{
                            bgcolor: user.status === "Active" ? '#DCFCE7' : '#FEE2E2',
                            color: user.status === "Active" ? '#166534' : '#991B1B',
                            px: 2, py: 0.75, borderRadius: '8px', display: 'inline-block', fontSize: '0.9rem', fontWeight: 700
                          }}
                        >
                          {user.status}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '1rem', color: '#6b7280', py: 1.5 }}>
                        {user.lastLogged ? new Date(user.lastLogged).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell sx={{ fontSize: '1rem', color: '#6b7280', py: 2 }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "No Date Available"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </Box>
   );
};

export default Users;