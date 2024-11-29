import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  IconButton,
  Link,
} from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import { ReactComponent as RobloxLogo } from './roblox-logo.svg';

const Header = () => {
  const theme = useTheme();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: '#ffffff',
        borderBottom: '2px solid #e0e0e0',
        position: 'relative',
      }}
    >
      <Toolbar 
        sx={{ 
          minHeight: '68px !important',
          px: { xs: 2, md: 4 },
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              background: '#ffffff',
              width: 44,
              height: 44,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <RobloxLogo 
              className="icon"
              sx={{ 
                width: 26,
                height: 26,
                color: '#333333',
                position: 'relative',
                transition: 'transform 0.3s ease',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
              }}
            />
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: '#333333',
                letterSpacing: '-0.5px',
                fontSize: '1.25rem',
              }}
            >
              Json Blox
            </Typography>
            <Typography 
              variant="caption"
              sx={{
                color: '#666666',
                display: 'block',
                fontWeight: 500,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: '0.675rem',
              }}
            >
            Highly Performant and User-Friendly JSON Visualization Toolkit
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Link
          href="https://github.com/WAcry/JsonBlox"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: 'inherit',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <IconButton
            size="large"
            edge="end"
            aria-label="github repository"
            sx={{
              color: '#666666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <GitHubIcon />
          </IconButton>
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
