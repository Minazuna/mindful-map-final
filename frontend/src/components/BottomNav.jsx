import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookIcon from '@mui/icons-material/Book';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import RecommendIcon from '@mui/icons-material/Recommend';

const BottomNav = ({ value, setValue }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 'entries':
        navigate('/mood-entries');
        break;
      case 'statistics':
        navigate('/statistics');
        break;
      case 'activities':
        navigate('/activities');
        break;
      case 'calendar':
        navigate('/calendar-log');
        break;
      case 'journal':
        navigate('/journal-logs');
        break;
      case 'prediction':
        navigate('/prediction');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'logout':
        handleLogoutClick();
        break;
      default:
        navigate('/home');
    }
  };

  const handleLogoutClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  return (
    <>
      <BottomNavigation 
        value={value} 
        onChange={handleChange} 
        className="fixed bottom-0 left-0 right-0 bg-white shadow-md"
        sx={{ 
          zIndex: 50,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '8px 0',
            color: '#b1b1b1',
            '&.Mui-selected': {
              color: '#6fba94'
            }
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            display: 'block',
            marginTop: '4px'
          }
        }}
        showLabels
      >
        <BottomNavigationAction
          label="Entries"
          value="entries"
          icon={<ListAltIcon />}
          style={{ color: value === 'entries' ? '#6fba94' : '#b1b1b1' }}
        />
        <BottomNavigationAction
          label="Statistics"
          value="statistics"
          icon={<BarChartIcon />}
          style={{ color: value === 'statistics' ? '#6fba94' : '#b1b1b1' }}
        />
        <BottomNavigationAction
          label="Activities"
          value="activities"
          icon={<RecommendIcon />}
          style={{ color: value === 'activities' ? '#6fba94' : '#b1b1b1' }}
        />
        <BottomNavigationAction
          label="Calendar"
          value="calendar"
          icon={<CalendarTodayIcon />}
          style={{ color: value === 'calendar' ? '#6fba94' : '#b1b1b1' }}
        />
        <BottomNavigationAction
          label="Journal"
          value="journal"
          icon={<BookIcon />}
          style={{ color: value === 'journal' ? '#6fba94' : '#b1b1b1' }}
        />
        <BottomNavigationAction
          label="Predictions"
          value="prediction"
          icon={<LightbulbIcon />}
          style={{ color: value === 'prediction' ? '#6fba94' : '#b1b1b1' }}
        />
        <BottomNavigationAction
          label="Profile"
          value="profile"
          icon={<PersonIcon />}
          style={{ color: value === 'profile' ? '#6fba94' : '#b1b1b1' }}
        />
        <BottomNavigationAction
          label="Logout"
          value="logout"
          icon={<ExitToAppIcon />}
          style={{ color: value === 'logout' ? '#6fba94' : '#b1b1b1' }}
        />
      </BottomNavigation>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmLogout} color="primary" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BottomNav;