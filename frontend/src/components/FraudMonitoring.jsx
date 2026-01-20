import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import adminService from '../services/adminService';

const FraudMonitoring = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    classification: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  // Log component mount
  useEffect(() => {
    console.log('FraudMonitoring component mounted');
    // Load initial data
    loadFraudLogs();
  }, []);

  const loadFraudLogs = useCallback(async () => {
    console.log('Loading fraud logs...');
    setLoading(true);
    setError('');
    
    try {
      const response = await adminService.getFraudLogs(
        pagination.page,
        10,
        {
          classification: filters.classification,
          status: filters.status
        }
      );
      
      console.log('Fraud logs response:', response);
      
      if (response.success) {
        setLogs(response.data);
        setPagination({
          page: response.pagination.current,
          totalPages: response.pagination.pages,
          totalItems: response.pagination.total
        });
      } else {
        setError(response.message || 'Failed to load fraud logs');
      }
    } catch (err) {
      console.error('Error loading fraud logs:', err);
      setError(err.message || 'Failed to load fraud logs. Please try again later.');
      // Set some mock data for testing if there's an error
      setLogs([
        {
          id: '1',
          attemptTime: new Date().toISOString(),
          user: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          station: {
            name: 'Test Station 1'
          },
          classification: 'High-Risk',
          decisionPath: 'Duration < 15 mins AND RegTime < 30 days',
          status: 'Logged'
        },
        {
          id: '2',
          attemptTime: new Date(Date.now() - 86400000).toISOString(),
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          station: {
            name: 'Test Station 2'
          },
          classification: 'Legitimate',
          decisionPath: 'Standard booking pattern',
          status: 'Reviewed'
        }
      ]);
      setPagination({
        page: 1,
        totalPages: 1,
        totalItems: 2
      });
    } finally {
      console.log('Finished loading fraud logs');
      setLoading(false);
    }
  }, [pagination.page, filters]);

  const handleUpdateStatus = async (logId, newStatus) => {
    try {
      // In a real implementation, you would call an API to update the status
      // For now, we'll just update the local state
      setLogs(logs.map(log => 
        log.id === logId ? { ...log, status: newStatus } : log
      ));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value
    });
  };

  const handlePageChange = (event, newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  // Load data when filters or pagination change
  useEffect(() => {
    loadFraudLogs();
  }, [pagination.page, filters, loadFraudLogs]);

  const getClassificationChip = (classification) => {
    const chipProps = {
      'Legitimate': { label: 'Legitimate', color: 'success', variant: 'outlined' },
      'High-Risk': { label: 'High-Risk', color: 'error', variant: 'filled' }
    }[classification] || { label: classification, color: 'default' };
    
    return (
      <Chip
        label={chipProps.label}
        color={chipProps.color}
        variant={chipProps.variant}
        size="small"
      />
    );
  };

  const getStatusChip = (status) => {
    const chipProps = {
      'Logged': { label: 'Logged', color: 'default', variant: 'outlined' },
      'Reviewed': { label: 'Reviewed', color: 'primary', variant: 'outlined' },
      'Action Taken': { label: 'Action Taken', color: 'success', variant: 'filled' }
    }[status] || { label: status, color: 'default' };
    
    return (
      <Chip
        label={chipProps.label}
        color={chipProps.color}
        variant={chipProps.variant}
        size="small"
      />
    );
  };

  return (
    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Fraud Monitoring
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton onClick={loadFraudLogs} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Classification</InputLabel>
            <Select
              label="Classification"
              value={filters.classification}
              onChange={handleFilterChange('classification')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Legitimate">Legitimate</MenuItem>
              <MenuItem value="High-Risk">High-Risk</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={filters.status}
              onChange={handleFilterChange('status')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Logged">Logged</MenuItem>
              <MenuItem value="Reviewed">Reviewed</MenuItem>
              <MenuItem value="Action Taken">Action Taken</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search..."
            value={filters.search}
            onChange={handleFilterChange('search')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Attempt Time</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Station</TableCell>
                    <TableCell>Classification</TableCell>
                    <TableCell>Decision Path</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No fraud logs found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(log.attemptTime).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {log.user?.name || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.user?.email || 'No email'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.station?.name || 'Unknown Station'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getClassificationChip(log.classification)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.decisionPath}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(log.status)}
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={log.status}
                            onChange={(e) => handleUpdateStatus(log.id, e.target.value)}
                            sx={{ minWidth: 120 }}
                          >
                            <MenuItem value="Logged">Logged</MenuItem>
                            <MenuItem value="Reviewed">Reviewed</MenuItem>
                            <MenuItem value="Action Taken">Action Taken</MenuItem>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FraudMonitoring;