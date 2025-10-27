import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Chip,
  Stack,
  Divider,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadIcon from '@mui/icons-material/Upload';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EvStationIcon from '@mui/icons-material/EvStation';
import stationManagerService from '../services/stationManagerService';

const CHARGER_TYPES = ['type1', 'type2', 'bharat_ac_001', 'bharat_dc_001', 'ccs2', 'chademo', 'gbt_type6', 'type7_leccs', 'mcs', 'chaoji'];
const PRICING_MODELS = ['per_kwh', 'per_minute', 'flat_fee', 'dynamic'];

const StationManagerStationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [station, setStation] = useState(null);
  const [imagesUploading, setImagesUploading] = useState(false);
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
  const API_ORIGIN = API_BASE.replace(/\/api$/,'');


  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await stationManagerService.getStationDetails(id);
      if (res.success) {
        console.log('Station data from API:', res.data);
        console.log('Station images:', res.data.images);
        setStation(res.data);
      } else {
        throw new Error(res.message || 'Failed to load station');
      }
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    try {
      const res = await stationManagerService.deleteStationImage(id, imageUrl);
      if (!res.success) throw new Error(res.message || 'Failed to delete image');
      setSnackbar({ open: true, message: 'Image deleted', severity: 'success' });
      setStation((prev) => ({ ...prev, images: (prev.images || []).filter((u) => u !== imageUrl) }));
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    }
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateField = (path, value) => {
    setStation((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (cur[k] == null) cur[k] = {};
        cur = cur[k];
      }
      cur[keys.at(-1)] = value;
      return next;
    });
  };

  const handleSave = async () => {
    if (!station) return;
    try {
      setSaving(true);
      const payload = {
        name: station.name,
        description: station.description,
        'location.address': station.location?.address,
        'location.city': station.location?.city,
        'location.state': station.location?.state,
        'location.pincode': station.location?.pincode,
        'location.nearbyLandmarks': station.location?.nearbyLandmarks || '',
        'capacity.totalChargers': station.capacity?.totalChargers,
        'capacity.chargerTypes': station.capacity?.chargerTypes || [],
        'capacity.maxPowerPerCharger': station.capacity?.maxPowerPerCharger,
        'pricing.model': station.pricing?.model,
        'pricing.basePrice': station.pricing?.basePrice,
        'pricing.cancellationPolicy': station.pricing?.cancellationPolicy || '',
        'operational.status': station.operational?.status,
        'operational.parkingSlots': station.operational?.parkingSlots,
        'operational.parkingFee': station.operational?.parkingFee || 0,
        'operational.operatingHours.is24Hours': station.operational?.operatingHours?.is24Hours,
        'operational.operatingHours.customHours.start': station.operational?.operatingHours?.customHours?.start,
        'operational.operatingHours.customHours.end': station.operational?.operatingHours?.customHours?.end,
        amenities: station.amenities || [],
      };
      const res = await stationManagerService.updateStationDetails(id, payload);
      if (!res.success) throw new Error(res.message || 'Failed to update station');
      setSnackbar({ open: true, message: 'Station updated successfully', severity: 'success' });
      await loadDetails();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
      setImagesUploading(true);
      const res = await stationManagerService.uploadStationImages(id, files);
      if (!res.success) throw new Error(res.message || 'Failed to upload images');
      setSnackbar({ open: true, message: 'Images uploaded successfully', severity: 'success' });
      await loadDetails();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setImagesUploading(false);
      event.target.value = '';
    }
  };

  if (loading || !station) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" component="label" startIcon={<UploadIcon />} disabled={imagesUploading}>
              Upload Images
              <input type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
            </Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Station Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Name" fullWidth value={station.name || ''} onChange={(e) => updateField('name', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Code" fullWidth value={station.code || ''} disabled />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Description" fullWidth multiline minRows={2} value={station.description || ''} onChange={(e) => updateField('description', e.target.value)} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField label="Address" fullWidth value={station.location?.address || ''} onChange={(e) => updateField('location.address', e.target.value)} />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField label="City" fullWidth value={station.location?.city || ''} onChange={(e) => updateField('location.city', e.target.value)} />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField label="State" fullWidth value={station.location?.state || ''} onChange={(e) => updateField('location.state', e.target.value)} />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField label="Pincode" fullWidth value={station.location?.pincode || ''} onChange={(e) => updateField('location.pincode', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={9}>
                    <TextField label="Nearby Landmarks" fullWidth value={station.location?.nearbyLandmarks || ''} onChange={(e) => updateField('location.nearbyLandmarks', e.target.value)} />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField type="number" label="Total Chargers" fullWidth value={station.capacity?.totalChargers || 0} onChange={(e) => updateField('capacity.totalChargers', Number(e.target.value))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField type="number" label="Max Power/Charger (kW)" fullWidth value={station.capacity?.maxPowerPerCharger || 0} onChange={(e) => updateField('capacity.maxPowerPerCharger', Number(e.target.value))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Charger Types</InputLabel>
                      <Select
                        multiple
                        label="Charger Types"
                        value={station.capacity?.chargerTypes || []}
                        onChange={(e) => updateField('capacity.chargerTypes', e.target.value)}
                      >
                        {CHARGER_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Pricing Model</InputLabel>
                      <Select
                        label="Pricing Model"
                        value={station.pricing?.model || 'per_kwh'}
                        onChange={(e) => updateField('pricing.model', e.target.value)}
                      >
                        {PRICING_MODELS.map((m) => (
                          <MenuItem key={m} value={m}>{m}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField type="number" label="Base Price (₹)" fullWidth value={station.pricing?.basePrice || 0} onChange={(e) => updateField('pricing.basePrice', Number(e.target.value))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Cancellation Policy" fullWidth value={station.pricing?.cancellationPolicy || ''} onChange={(e) => updateField('pricing.cancellationPolicy', e.target.value)} />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Operational Status</InputLabel>
                      <Select
                        label="Operational Status"
                        value={station.operational?.status || 'active'}
                        onChange={(e) => updateField('operational.status', e.target.value)}
                      >
                        <MenuItem value="active">active</MenuItem>
                        <MenuItem value="inactive">inactive</MenuItem>
                        <MenuItem value="maintenance">maintenance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <TextField type="number" label="Parking Slots" fullWidth value={station.operational?.parkingSlots || 0} onChange={(e) => updateField('operational.parkingSlots', Number(e.target.value))} />
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <TextField type="number" label="Parking Fee (₹/hr)" fullWidth value={station.operational?.parkingFee || 0} onChange={(e) => updateField('operational.parkingFee', Number(e.target.value))} />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Amenities</Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {(station.amenities || []).map((a, idx) => (
                        <Chip key={idx} label={a} onDelete={() => updateField('amenities', (station.amenities || []).filter((_, i) => i !== idx))} />
                      ))}
                    </Stack>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <TextField size="small" placeholder="Add amenity" onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            updateField('amenities', [ ...(station.amenities || []), val ]);
                            e.currentTarget.value = '';
                          }
                        }
                      }} />
                      <Button variant="outlined" onClick={(e) => {
                        const input = e.currentTarget.previousSibling;
                        if (input && input.value.trim()) {
                          updateField('amenities', [ ...(station.amenities || []), input.value.trim() ]);
                          input.value = '';
                        }
                      }}>Add</Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Station Photos & Gallery</Typography>
                <Grid container spacing={2}>
                  {(station.images || []).length === 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <EvStationIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          High-quality photos of charging bays, facilities, and surroundings coming soon
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Display uploaded images in the left column */}
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      {(station.images || []).map((url, idx) => (
                        <Grid item xs={12} key={idx}>
                          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <img 
                              alt={`station-${idx}`} 
                              src={url || 'https://via.placeholder.com/400x300/cccccc/ffffff?text=No+Image'}
                              style={{ width: '100%', height: 'auto', display: 'block' }} 
                              onError={(e) => {
                                console.log('Image load error for URL:', url);
                                e.target.src = 'https://via.placeholder.com/400x300/cccccc/ffffff?text=No+Image'; // Better fallback image
                              }}
                            />
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleDeleteImage(url)}
                              startIcon={<DeleteIcon />}
                              sx={{ position: 'absolute', top: 8, right: 8, borderRadius: 2, minHeight: 0, py: 0.25 }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                  
                  {/* Display thumbnails in the right column */}
                  <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                      {Array.from({ length: Math.max(3, (station.images || []).length) }).map((_, idx) => (
                        <Box 
                          key={idx} 
                          sx={{ 
                            height: 80, 
                            border: '1px dashed #ccc', 
                            borderRadius: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                            overflow: 'hidden'
                          }}
                        >
                          {(station.images || [])[idx] ? (
                            <img 
                              src={(station.images || [])[idx] || 'https://via.placeholder.com/80x80/cccccc/ffffff?text=No+Image'}
                              alt={`thumb-${idx}`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                console.log('Thumbnail load error for URL:', (station.images || [])[idx]);
                                e.target.src = 'https://via.placeholder.com/80x80/cccccc/ffffff?text=No+Image';
                              }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Photo {idx + 1}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
                
                {/* Upload Button */}
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    startIcon={<PhotoCameraIcon />} 
                    fullWidth
                    disabled={imagesUploading}
                  >
                    {imagesUploading ? 'Uploading...' : 'Upload New Images'}
                    <input 
                      type="file" 
                      hidden 
                      multiple 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                    />
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StationManagerStationDetails;
