import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@mui/material';
import { useTranslation } from './LocalizationProvider';
import { useCatch } from '../../reactHelper';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
const AddressValue = ({ latitude, longitude, originalAddress }) => {
  const t = useTranslation();
  
  const addressEnabled = useSelector((state) => state.session.server.geocoderEnabled);

  const [fetchedAddress, setFetchedAddress] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset lại khi tọa độ hoặc địa chỉ gốc thay đổi
    setFetchedAddress(null);
    setIsVisible(false);
  }, [latitude, longitude, originalAddress]);

  const showAddress = useCatch(async () => {
    if (!fetchedAddress) {
      const query = new URLSearchParams({ latitude, longitude });
      const response = await fetch(`/api/server/geocode?${query.toString()}`);
      if (response.ok) {
        const text = await response.text();
        setFetchedAddress(text);
        setIsVisible(true);
      } else {
        throw Error(await response.text());
      }
    } else {
      // Đã fetch rồi thì chỉ toggle hiển thị
      setIsVisible(!isVisible);
    }
  });

  if (!addressEnabled) return '';

  return (
    <Link href="#" onClick={(e) => { e.preventDefault(); showAddress(); }}>
      {isVisible && fetchedAddress ? fetchedAddress : <RemoveRedEyeIcon />}
    </Link>
  );
};

export default AddressValue;
