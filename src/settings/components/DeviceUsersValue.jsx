import React, { useState } from 'react';
import { Link } from '@mui/material';
import { useCatch } from '../../reactHelper';
import { useTranslation } from '../../common/components/LocalizationProvider';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
const DeviceUsersValue = ({ deviceId }) => {
  const t = useTranslation();

  const [users, setUsers] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const loadUsers = useCatch(async () => {
    if (!users) {
      const query = new URLSearchParams({ deviceId });
      const response = await fetch(`/api/users?${query.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setUsers(result);
        setIsVisible(true);
      } else {
        throw Error(await response.text());
      }
    } else {
      setIsVisible(!isVisible);
    }
  });

  return (
    <>
      <Link href="#" onClick={(e) => { e.preventDefault(); loadUsers(); }}>
        {isVisible && users ? (
          users.map((user) => user.name).join(', ')
        ) : (
          <RemoveRedEyeIcon />
        )}
      </Link>
    </>
  );
};

export default DeviceUsersValue;
