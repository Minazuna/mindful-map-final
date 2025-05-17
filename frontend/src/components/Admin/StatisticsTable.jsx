import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse } from '@mui/material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Navbar from './Navbar';

const StatisticsTable = () => {
  const [statistics, setStatistics] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/correlation-values`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Fetched data:', response.data); // Debugging log
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSearch = (event) => {
    setSearchText(event.target.value);
  };

  const handleRowClick = (rowId, section) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [section]: !prev[rowId]?.[section],
      },
    }));
  };

  const filteredStatistics = statistics.filter((stat) =>
    stat.user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleDownloadPDF = () => {
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

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Statistics Report", margin, lineY + 20);

      let currentY = lineY + 30;

      filteredStatistics.forEach((stat) => {
        doc.autoTable({
          head: [['Email', 'Date', 'Activities', 'Social', 'Sleep Quality', 'Health', 'Recommendations']],
          body: [[
            stat.user.email,
            new Date(stat.createdAt).toLocaleDateString(),
            '',
            '',
            '',
            stat.correlationResults[3] ? `${stat.correlationResults[3].healthStatus ? stat.correlationResults[3].healthStatus.charAt(0).toUpperCase() + stat.correlationResults[3].healthStatus.slice(1) : ''}` : '',
            stat.recommendations ? stat.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n') : '',
          ]],
          startY: currentY,
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

        currentY = doc.autoTable.previous.finalY + 10;

        if (expandedRows[stat._id]?.activities) {
          doc.autoTable({
            head: [['Value', 'Mood', 'Activity']],
            body: [
              [
                stat.correlationResults[0]?.correlationValue || '',
                stat.correlationResults[0]?.correlationMood || '',
                stat.correlationResults[0]?.correlationActivity || '',
              ],
            ],
            startY: currentY,
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

          currentY = doc.autoTable.previous.finalY + 10;
        }

        if (expandedRows[stat._id]?.social) {
          doc.autoTable({
            head: [['Value', 'Mood', 'Social']],
            body: [
              [
                stat.correlationResults[1]?.correlationValue || '',
                stat.correlationResults[1]?.correlationMood || '',
                stat.correlationResults[1]?.correlationSocial || '',
              ],
            ],
            startY: currentY,
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

          currentY = doc.autoTable.previous.finalY + 10;
        }

        if (expandedRows[stat._id]?.sleepQuality) {
          doc.autoTable({
            head: [['Value', 'Sleep Quality']],
            body: [
              [
                stat.correlationResults[2]?.sleepQualityValue || '',
                stat.correlationResults[2]?.sleepQuality || '',
              ],
            ],
            startY: currentY,
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

          currentY = doc.autoTable.previous.finalY + 10;
        }
      });

      doc.save('statistics.pdf');
    }).catch(error => {
      console.error('Error loading images:', error);
    });
  };

  const cellStyle = { fontFamily: 'Nunito' };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAF9" }}>
      <Box sx={{ width: 240, flexShrink: 0 }}>
        <Navbar />
      </Box>
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
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333", fontFamily: 'Nunito' }}>
              Statistics
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Search..."
                size="small"
                value={searchText}
                onChange={handleSearch}
                sx={{
                  width: 280,
                  bgcolor: "#F5F5F5",
                  borderRadius: 1,
                  fontFamily: 'Nunito'
                }}
                InputProps={{
                  style: { fontFamily: 'Nunito' }, // Added fontFamily
                }}
              />
              <IconButton onClick={handleDownloadPDF} sx={{ color: "#1976D2" }}>
                <FileDownloadIcon />
              </IconButton>
            </Box>
          </Box>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table aria-label="statistics table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Activities</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Social</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Sleep Quality</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Health</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Recommendations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStatistics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>No statistics found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStatistics.map((stat) => (
                    <React.Fragment key={stat._id}>
                      <TableRow hover>
                        <TableCell sx={cellStyle}>{stat.user.email}</TableCell>
                        <TableCell sx={cellStyle}>{new Date(stat.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell sx={cellStyle} onClick={() => handleRowClick(stat._id, 'activities')}>
                          {expandedRows[stat._id]?.activities ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </TableCell>
                        <TableCell sx={cellStyle} onClick={() => handleRowClick(stat._id, 'social')}>
                          {expandedRows[stat._id]?.social ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </TableCell>
                        <TableCell sx={cellStyle} onClick={() => handleRowClick(stat._id, 'sleepQuality')}>
                          {expandedRows[stat._id]?.sleepQuality ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </TableCell>
                        <TableCell sx={cellStyle}>
                          {stat.correlationResults[3] && (
                            <>
                              {stat.correlationResults[3].healthStatus ? stat.correlationResults[3].healthStatus.charAt(0).toUpperCase() + stat.correlationResults[3].healthStatus.slice(1) : ''}
                            </>
                          )}
                        </TableCell>
                        <TableCell sx={cellStyle}>
                          {stat.recommendations && stat.recommendations.map((rec, index) => (
                            <div key={index}>{index + 1}. {rec}</div>
                          ))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
                          <Collapse in={expandedRows[stat._id]?.activities} timeout="auto" unmountOnExit>
                            <Box margin={1}>
                              <Table size="small" aria-label="activities" sx={{ mb: 2 }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' , fontFamily: 'Nunito'}}>Value</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Mood</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontFamily: 'Nunito' }}>Activity</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {stat.correlationResults[0] && (
                                    <TableRow>
                                      <TableCell sx={cellStyle}>{stat.correlationResults[0].correlationValue}</TableCell>
                                      <TableCell sx={cellStyle}>{stat.correlationResults[0].correlationMood}</TableCell>
                                      <TableCell sx={cellStyle}>{stat.correlationResults[0].correlationActivity}</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
                          <Collapse in={expandedRows[stat._id]?.social} timeout="auto" unmountOnExit>
                            <Box margin={1}>
                              <Table size="small" aria-label="social" sx={{ mb: 2 }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Value</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Mood</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Social</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {stat.correlationResults[1] && (
                                    <TableRow>
                                      <TableCell sx={cellStyle}>{stat.correlationResults[1].correlationValue}</TableCell>
                                      <TableCell sx={cellStyle}>{stat.correlationResults[1].correlationMood}</TableCell>
                                      <TableCell sx={cellStyle}>{stat.correlationResults[1].correlationSocial}</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
                          <Collapse in={expandedRows[stat._id]?.sleepQuality} timeout="auto" unmountOnExit>
                            <Box margin={1}>
                              <Table size="small" aria-label="sleep quality">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Value</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Sleep Quality</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {stat.correlationResults[2] && (
                                    <TableRow>
                                      <TableCell sx={cellStyle}>{stat.correlationResults[2].sleepQualityValue}</TableCell>
                                      <TableCell sx={cellStyle}>{stat.correlationResults[2].sleepQuality}</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
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

export default StatisticsTable;