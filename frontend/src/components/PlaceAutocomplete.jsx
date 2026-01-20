import React, { useState, useEffect, useRef } from 'react';
import { TextField, Box } from '@mui/material';
import { Autocomplete } from '@react-google-maps/api';

const PlaceAutocomplete = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  helperText,
  required = false,
  error = false
}) => {
  const [autocomplete, setAutocomplete] = useState(null);
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const placeName = place.formatted_address || place.name;
        
        setInputValue(placeName);
        
        // Call the onChange callback with coordinates and place name
        if (onChange) {
          onChange({
            lat: lat,
            lng: lng,
            placeName: placeName,
            placeId: place.place_id
          });
        }
      }
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: ['in', 'us', 'gb', 'ae'] }, // Restrict to these countries
          fields: ['geometry', 'formatted_address', 'name', 'place_id']
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          label={label}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          helperText={helperText}
          required={required}
          error={error}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: error ? 'error.main' : 'inherit',
              },
            },
          }}
        />
      </Autocomplete>
    </Box>
  );
};

export default PlaceAutocomplete;
