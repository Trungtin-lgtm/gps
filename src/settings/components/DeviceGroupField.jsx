import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import AddIcon from '@mui/icons-material/Add';
import { groupsActions } from '../../store';
import { useCatch } from '../../reactHelper';

const createOptionKey = '__create_group__';

const DeviceGroupField = ({ value, onChange, label }) => {
  const dispatch = useDispatch();
  const groups = useSelector((state) => state.groups.items);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const options = useMemo(() => Object.values(groups)
    .sort((first, second) => first.name.localeCompare(second.name)), [groups]);

  const filter = useMemo(() => createFilterOptions({
    stringify: (option) => option.name,
  }), []);

  const closeDialog = () => {
    setDialogOpen(false);
    setNewGroupName('');
  };

  const createGroup = useCatch(async () => {
    const name = newGroupName.trim();
    if (!name) {
      return;
    }

    const existing = options.find((group) => group.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing) {
      onChange({ target: { value: existing.id } });
      closeDialog();
      return;
    }

    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw Error(await response.text());
    }

    const createdGroup = await response.json();
    const groupsResponse = await fetch('/api/groups');
    if (!groupsResponse.ok) {
      throw Error(await groupsResponse.text());
    }

    dispatch(groupsActions.refresh(await groupsResponse.json()));
    onChange({ target: { value: createdGroup.id } });
    closeDialog();
  });

  return (
    <>
      <Autocomplete
        size="small"
        options={options}
        value={options.find((group) => group.id === value) || null}
        getOptionLabel={(option) => option.name || ''}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        filterOptions={(items, params) => {
          const filtered = filter(items, params);
          const typedName = params.inputValue.trim();
          const duplicate = typedName && items.some((group) => group.name.trim().toLocaleLowerCase() === typedName.toLocaleLowerCase());
          if (!duplicate) {
            filtered.push({ id: createOptionKey, name: typedName, create: true });
          }
          return filtered;
        }}
        onChange={(_, option) => {
          if (option?.create) {
            setNewGroupName(option.name);
            setDialogOpen(true);
          } else {
            onChange({ target: { value: option ? option.id : 0 } });
          }
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.create ? createOptionKey : option.id}>
            {option.create ? <><AddIcon fontSize="small" />&nbsp;{option.name ? `Tạo nhóm “${option.name}”` : 'Tạo nhóm mới'}</> : option.name}
          </li>
        )}
        renderInput={(params) => <TextField {...params} label={label} />}
      />
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>Tạo nhóm mới</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Tên nhóm"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && newGroupName.trim()) {
                event.preventDefault();
                createGroup();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button variant="contained" onClick={createGroup} disabled={!newGroupName.trim()}>
            Tạo nhóm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeviceGroupField;
