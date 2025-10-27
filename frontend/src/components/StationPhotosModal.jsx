import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  Stack,
  IconButton
} from '@mui/material';
import {
  EvStation as EvStationIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import stationManagerService from '../services/stationManagerService';

const StationPhotosModal = ({ open, onClose, station, onRefresh }) => {
  const [imagesUploading, setImagesUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    // Use _id if available, otherwise use id
    const stationId = station?._id || station?.id;
    if (!stationId) return;
    
    try {
      setImagesUploading(true);
      const res = await stationManagerService.uploadStationImages(stationId, files);
      if (!res.success) throw new Error(res.message || 'Failed to upload images');
      
      // Refresh the station data
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setImagesUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    // Use _id if available, otherwise use id
    const stationId = station?._id || station?.id;
    if (!stationId) return;
    
    try {
      setDeletingImage(imageUrl);
      const res = await stationManagerService.deleteStationImage(stationId, imageUrl);
      if (!res.success) throw new Error(res.message || 'Failed to delete image');
      
      // Refresh the station data
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      setDeletingImage(null);
    }
  };

  // Add null check for station
  const stationImages = station?.images || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Station Photos & Gallery</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {stationImages.length === 0 && (
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
              {stationImages.map((url, idx) => (
                <Grid item xs={12} key={idx}>
                  <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <img 
                      alt={`station-${idx}`} 
                      src={url || 'https://via.placeholder.com/400x300/cccccc/ffffff?text=No+Image'}
                      style={{ width: '100%', height: 'auto', display: 'block' }} 
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300/cccccc/ffffff?text=No+Image';
                      }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleDeleteImage(url)}
                      disabled={deletingImage === url}
                      startIcon={<DeleteIcon />}
                      sx={{ position: 'absolute', top: 8, right: 8, borderRadius: 2, minHeight: 0, py: 0.25 }}
                    >
                      {deletingImage === url ? 'Deleting...' : 'Delete'}
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
          
          {/* Display thumbnails in the right column */}
          <Grid item xs={12} md={4}>
            <Stack spacing={1}>
              {Array.from({ length: Math.max(3, stationImages.length) }).map((_, idx) => (
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
                  {stationImages[idx] ? (
                    <img 
                      src={stationImages[idx] || 'https://via.placeholder.com/80x80/cccccc/ffffff?text=No+Image'}
                      alt={`thumb-${idx}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
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
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          variant="outlined" 
          component="label" 
          startIcon={<PhotoCameraIcon />} 
          disabled={imagesUploading || !station}
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
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StationPhotosModal;