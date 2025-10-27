import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, Chip, IconButton, TextField, Button } from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import UserNavbar from '../components/UserNavbar';
import StationsWithGoogleMap from '../components/StationsWithGoogleMap';
import Footer from '../components/Footer';
import { getMe, getPublicStationsApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useRealTimeAvailability } from '../hooks/useRealTimeAvailability';

const StationsPage = () => {
  console.log('StationsPage rendered at:', new Date().toLocaleTimeString());
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);

  // Get station IDs for real-time availability (memoized to prevent unnecessary re-renders)
  const stationIds = useMemo(() => {
    const ids = stations.map(s => s._id);
    console.log('Station IDs updated:', ids);
    return ids;
  }, [stations]);
  const { availability: realTimeAvailability } = useRealTimeAvailability(stationIds, 15000); // Refresh every 15 seconds

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe().catch(() => null);
        setUser(me);
      } catch {}
    })();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await getPublicStationsApi({ search });
      setStations(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadStations(); // initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add this useEffect to trigger search when search term changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadStations();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleGetDirections = (station, event) => {
    event.stopPropagation();
    setSelectedStation(station);
  };


  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <UserNavbar user={user} />
      <Box component="main" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>Stations</Typography>
            <Typography variant="body2" color="text.secondary">Browse and find charging stations near you</Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={9}>
              <TextField fullWidth placeholder="Search stations by name..." value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button fullWidth variant="outlined" startIcon={<MyLocationIcon />} onClick={loadStations}>My Location</Button>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Left: Stations List */}
            <Grid item xs={12} md={7} lg={8}>
              <Grid container spacing={2}>
                {loading && (
                  <Grid item xs={12}><Typography>Loading stations...</Typography></Grid>
                )}
                {!loading && stations.length === 0 && (
                  <Grid item xs={12}><Typography color="text.secondary">No stations found.</Typography></Grid>
                )}
                {stations.map((s) => {
              // Pricing label
              const pricingLabel = (() => {
                if (!s || typeof s.pricing !== 'object') return s?.pricing || null;
                const ppm = s.pricing.pricePerMinute ?? s.pricing.basePrice; // fallback to legacy
                return typeof ppm === 'number' ? `₹${ppm}/minute` : 'Pricing';
              })();
              // Connector types from capacity
              const chargerTypes = Array.isArray(s?.capacity?.chargerTypes)
                ? s.capacity.chargerTypes.map((t) => (typeof t === 'string' ? t : (t?.type || 'charger')))
                : [];
              // Status and availability (use real-time data if available)
              const rawStatus = s?.operational?.status;
              const isMaintenance = rawStatus === 'maintenance';
              const realtimeData = realTimeAvailability[s._id];
              const available = realtimeData ? realtimeData.availableSlots : (typeof s?.availableSlots === 'number' ? s.availableSlots : undefined);
              const total = realtimeData ? realtimeData.totalChargers : (typeof s?.capacity?.totalChargers === 'number' ? s.capacity.totalChargers : undefined);
              const statusText = isMaintenance
                ? 'Under maintenance'
                : (rawStatus === 'active' ? 'Ready for charging' : (typeof rawStatus === 'string' ? rawStatus : undefined));
              // Rating and amenities (use station analytics rating)
              const rating = typeof s?.analytics?.rating === 'number' ? s.analytics.rating : 0;
              const amenities = Array.isArray(s?.amenities) && s.amenities.length > 0 ? s.amenities : null;
              return (
              <Grid item xs={12} sm={6} md={6} lg={6} key={s._id}>
                <Card 
                  elevation={selectedStation?._id === s._id ? 4 : 2} 
                  onClick={() => navigate(`/stations/${s._id}`)} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    cursor: 'pointer', 
                    border: selectedStation?._id === s._id ? '2px solid #4285F4' : 'none',
                    '&:hover': { boxShadow: 6 } 
                  }}
                >
                  <CardContent sx={{ p: 2, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mr: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || 'Station'}</Typography>
                      <IconButton size="small" onClick={(e) => handleGetDirections(s, e)}><DirectionsIcon /></IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
                      {chargerTypes[0] && (
                        <Chip size="small" label={chargerTypes[0]} />
                      )}
                      {isMaintenance ? (
                        <Chip size="small" color="warning" label="Under maintenance" />
                      ) : (
                        typeof available === 'number' && (
                          <Chip size="small" color="success" label={`${available}/${total ?? available} available`} />
                        )
                      )}
                      {pricingLabel && (
                        <Chip size="small" label={pricingLabel} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {`⭐ ${rating.toFixed(1)}/5`} • {amenities ? `${amenities.length} amenities` : 'No amenities listed'}
                    </Typography>
                    {statusText && (
                      <Typography variant="body2" color={isMaintenance ? 'warning.main' : 'text.secondary'}>
                        {statusText}
                      </Typography>
                    )}
                    <Button 
                      variant="contained" 
                      size="small"
                      fullWidth 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate(`/stations/${s._id}`); 
                      }}
                      disabled={isMaintenance}
                      sx={{ 
                        mt: 1,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        '&:hover': { 
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        },
                        '&:disabled': {
                          background: '#9ca3af'
                        }
                      }}
                    >
                      {isMaintenance ? '🚧 Under Maintenance' : '⚡ Book Now'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );})}
              </Grid>
            </Grid>

            {/* Right: Google Maps Panel */}
            <Grid item xs={12} md={5} lg={4}>
              <Box sx={{ position: 'sticky', top: 16, height: { xs: 320, md: 440 } }}>
                <StationsWithGoogleMap 
                  stations={stations}
                  selectedStation={selectedStation}
                  onStationSelect={setSelectedStation}
                  height={{ xs: 320, md: 440 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default StationsPage;